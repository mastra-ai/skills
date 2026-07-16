#!/usr/bin/env node

import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const CLASSIFICATIONS = ['unsupported', 'needs-review', 'supported'];
const CLASSIFICATION_ORDER = new Map(CLASSIFICATIONS.map((value, index) => [value, index]));
const SOURCE_EXTENSIONS = new Set(['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs']);
const ROUTED_EXTENSIONS = new Set(['.ts', '.js']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.mastra', 'dist', 'build', 'coverage']);
const INSTRUCTION_FILES = ['AGENTS.md', 'CLAUDE.md', 'COPILOT.md', 'GEMINI.md'];
const SINGLETONS = ['storage', 'observability', 'logger', 'server', 'studio'];
const LIMITATION = 'Source-text audit only: it does not execute modules, resolve every alias or spread, semantically parse template expressions or regular-expression literals, evaluate dynamic configuration, or prove behavioral equivalence or migration completeness. Sensitive template expressions are flagged for review; semantic agent review is always required.';

class AuditOperationalError extends Error {}

function usage() {
  return `Conservatively audit a Mastra project for file-based migration candidates.

Usage:
  node scripts/audit-project.mjs --project <path> [--format human|json]
  node scripts/audit-project.mjs --help

Options:
  --project <path>       Project root containing package.json (required)
  --format <human|json>  Output format (default: human)
  -h, --help             Show this help

Exit behavior:
  0  Audit completed, including when findings are present
  1  Invalid arguments, unreadable paths, or missing/invalid package.json

Examples:
  node scripts/audit-project.mjs --project .
  node scripts/audit-project.mjs --project ../app --format json

The audit is read-only. Findings are source-text evidence, not semantic proof.`;
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isTestFile(file) {
  return /(?:^|\.)+(?:test|spec)\.[^.]+$/.test(path.basename(file));
}

function lineForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function maskSource(source) {
  const code = [...source];
  const commentsMasked = [...source];
  const nonCodeRanges = [];
  const templateExpressionStarts = [];
  let index = 0;

  function canStartRegex(at) {
    let cursor = at - 1;
    while (cursor >= 0 && /\s/.test(source[cursor])) cursor -= 1;
    if (cursor < 0 || /[=(:,!&|?{};\[\]]/.test(source[cursor])) return true;
    const prefix = source.slice(0, cursor + 1);
    return /=>\s*$/.test(prefix) || /(?:^|[^A-Za-z0-9_$])(?:return|throw|case|delete|void|typeof|instanceof|in|of|yield|await)\s*$/.test(prefix);
  }

  function blank(target, start, end, preserveDelimiters = false) {
    for (let cursor = start; cursor < end; cursor += 1) {
      if (source[cursor] === '\n' || source[cursor] === '\r') continue;
      if (preserveDelimiters && (cursor === start || cursor === end - 1)) continue;
      target[cursor] = ' ';
    }
  }

  while (index < source.length) {
    if (source[index] === '/' && source[index + 1] === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') index += 1;
      blank(code, start, index);
      blank(commentsMasked, start, index);
      nonCodeRanges.push([start, index]);
      continue;
    }
    if (source[index] === '/' && source[index + 1] === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index += 1;
      index = Math.min(source.length, index + 2);
      blank(code, start, index);
      blank(commentsMasked, start, index);
      nonCodeRanges.push([start, index]);
      continue;
    }
    if (source[index] === '/' && canStartRegex(index)) {
      const start = index;
      let inCharacterClass = false;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === '[') inCharacterClass = true;
        if (source[index] === ']') inCharacterClass = false;
        if (source[index] === '/' && !inCharacterClass) {
          index += 1;
          while (/[A-Za-z]/.test(source[index] ?? '')) index += 1;
          break;
        }
        if (source[index] === '\n' || source[index] === '\r') break;
        index += 1;
      }
      blank(code, start, index, true);
      nonCodeRanges.push([start, index]);
      continue;
    }
    if (source[index] === "'" || source[index] === '"' || source[index] === '`') {
      const quote = source[index];
      const start = index;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (quote === '`' && source[index] === '$' && source[index + 1] === '{') {
          templateExpressionStarts.push(index);
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      blank(code, start, index, true);
      nonCodeRanges.push([start, index]);
      continue;
    }
    index += 1;
  }

  return {
    code: code.join(''),
    commentsMasked: commentsMasked.join(''),
    templateExpressionStarts,
    isCodeIndex(value) {
      return !nonCodeRanges.some(([start, end]) => value >= start && value < end);
    },
  };
}

function templateExpressionAt(source, start) {
  const expressionSource = source.slice(start + 2);
  const maskedExpression = maskSource(expressionSource).code;
  let depth = 1;
  for (let index = 0; index < maskedExpression.length; index += 1) {
    if (maskedExpression[index] === '{') depth += 1;
    if (maskedExpression[index] !== '}') continue;
    depth -= 1;
    if (depth === 0) return expressionSource.slice(0, index);
  }
  return null;
}

function matchingBraceEnd(code, start) {
  let depth = 0;
  for (let cursor = start; cursor < code.length; cursor += 1) {
    if (code[cursor] === '{') depth += 1;
    if (code[cursor] !== '}') continue;
    depth -= 1;
    if (depth === 0) return cursor + 1;
  }
  return null;
}

function mastraConstructorShapes(code) {
  const objectRanges = [];
  const dynamicArguments = [];
  for (const match of code.matchAll(/\bnew\s+Mastra\s*\(/g)) {
    let start = match.index + match[0].length;
    while (/\s/.test(code[start] ?? '')) start += 1;
    if (code[start] !== '{') {
      dynamicArguments.push(match.index);
      continue;
    }
    const end = matchingBraceEnd(code, start);
    if (end === null) dynamicArguments.push(match.index);
    else objectRanges.push([start, end]);
  }
  return { objectRanges, dynamicArguments };
}

function agentRoute(file) {
  const parts = file.split('/');
  if (parts[0] !== 'src' || parts[1] !== 'mastra' || parts[2] !== 'agents' || !parts[3]) return null;
  let cursor = 4;
  let subagentDepth = 0;
  while (parts[cursor] === 'subagents' && parts[cursor + 1]) {
    subagentDepth += 1;
    cursor += 2;
  }
  return { parts, remaining: parts.slice(cursor), root: parts.slice(0, cursor).join('/'), subagentDepth };
}

function hasDefaultExport(source) {
  return /\bexport\s+default\b/.test(maskSource(source).code);
}

function finding({ code, classification, severity, file, line, message, recommendedAction }) {
  const value = { code, classification, severity, file, message, recommendedAction };
  if (line !== undefined) value.line = line;
  return value;
}

function addFinding(findings, input) {
  findings.push(finding(input));
}

async function pathType(target) {
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink()) return 'symlink';
    if (info.isDirectory()) return 'directory';
    if (info.isFile()) return 'file';
    return 'other';
  } catch (error) {
    if (error.code === 'ENOENT') return 'missing';
    throw error;
  }
}

async function collectMastraEntries(mastraRoot, projectRoot) {
  const files = [];
  const directories = [];
  const symlinks = [];

  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      const relative = toPosix(path.relative(projectRoot, absolute));
      if (entry.isSymbolicLink()) {
        symlinks.push(relative);
      } else if (entry.isDirectory()) {
        directories.push(relative);
        await visit(absolute);
      } else if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  await visit(mastraRoot);
  return { files, directories, symlinks };
}

async function readSources(projectRoot, files) {
  const sources = new Map();
  for (const file of files) {
    if (!SOURCE_EXTENSIONS.has(path.extname(file)) && !file.endsWith('.md')) continue;
    try {
      sources.set(file, await readFile(path.join(projectRoot, file), 'utf8'));
    } catch (error) {
      throw new AuditOperationalError(`Cannot read ${file}: ${error.message}`);
    }
  }
  return sources;
}

function topLevelObjectProperties(maskedObject, originalObject) {
  const properties = [];
  const bodyStart = maskedObject.indexOf('{') + 1;
  const bodyEnd = maskedObject.lastIndexOf('}');
  if (bodyStart === 0 || bodyEnd < bodyStart) return properties;
  const maskedBody = maskedObject.slice(bodyStart, bodyEnd);
  const originalBody = originalObject.slice(bodyStart, bodyEnd);
  let segmentStart = 0;
  let depth = 0;
  for (let cursor = 0; cursor <= maskedBody.length; cursor += 1) {
    const character = maskedBody[cursor];
    if (character === '{' || character === '[' || character === '(') depth += 1;
    if (character === '}' || character === ']' || character === ')') depth -= 1;
    if (cursor < maskedBody.length && (character !== ',' || depth !== 0)) continue;
    const rawOriginal = originalBody.slice(segmentStart, cursor);
    const rawMasked = maskedBody.slice(segmentStart, cursor);
    const leading = rawMasked.length - rawMasked.trimStart().length;
    const originalSegment = rawOriginal.slice(leading);
    const maskedSegment = rawMasked.slice(leading);
    const keySource = maskSource(originalSegment).commentsMasked.trimStart();
    const quoted = /^(?:'([^']+)'|"([^"]+)")\s*:/.exec(keySource);
    const identifier = /^([A-Za-z_$][\w$]*)\s*(?=:|$)/.exec(keySource);
    let kind = 'property';
    let key = quoted?.[1] ?? quoted?.[2] ?? identifier?.[1] ?? null;
    if (/^\.\.\./.test(maskedSegment)) kind = 'spread';
    else if (/^\[/.test(maskedSegment)) kind = 'computed';
    if (key || kind !== 'property') {
      properties.push({ key, kind, maskedSegment, originalSegment, start: bodyStart + segmentStart + leading });
    }
    segmentStart = cursor + 1;
  }
  return properties;
}

function findObjectKeys(maskedSource, originalSource, property) {
  const keys = new Set();
  const registration = topLevelObjectProperties(maskedSource, originalSource).find(item => item.key === property);
  if (!registration) return keys;
  const colon = registration.maskedSegment.indexOf(':');
  if (colon === -1) return keys;
  let open = colon + 1;
  while (/\s/.test(registration.maskedSegment[open] ?? '')) open += 1;
  if (registration.maskedSegment[open] !== '{') return keys;
  const end = matchingBraceEnd(registration.maskedSegment, open);
  if (end === null) return keys;
  const maskedMap = registration.maskedSegment.slice(open, end);
  const originalMap = registration.originalSegment.slice(open, end);
  for (const item of topLevelObjectProperties(maskedMap, originalMap)) {
    if (item.key) keys.add(item.key);
  }
  return keys;
}

function fileBasedAgentDirectories(files) {
  const agents = new Map();
  for (const file of files) {
    const match = file.match(/^src\/mastra\/agents\/([^/]+)\/(config\.(?:ts|js)|instructions\.md)$/);
    if (!match) continue;
    if (!agents.has(match[1])) agents.set(match[1], new Set());
    agents.get(match[1]).add(match[2]);
  }
  return agents;
}

function workflowFiles(files) {
  return files.filter(file => /^src\/mastra\/workflows\/[^/]+\.(?:ts|js)$/.test(file) && !isTestFile(file));
}

function registrationSurfaces(sources) {
  const agents = new Set();
  const workflows = new Set();
  const globalScorers = new Set();
  for (const source of sources.values()) {
    const masked = maskSource(source);
    for (const [start, end] of mastraConstructorShapes(masked.code).objectRanges) {
      const maskedObject = masked.code.slice(start, end);
      const originalObject = source.slice(start, end);
      for (const key of findObjectKeys(maskedObject, originalObject, 'agents')) agents.add(key);
      for (const key of findObjectKeys(maskedObject, originalObject, 'workflows')) workflows.add(key);
      for (const key of findObjectKeys(maskedObject, originalObject, 'scorers')) globalScorers.add(key);
    }
  }
  return { agents, workflows, globalScorers };
}

function inspectInstructionFiles(instructionFiles, findings) {
  for (const file of instructionFiles) {
    addFinding(findings, {
      code: 'PROJECT_INSTRUCTIONS',
      classification: 'needs-review',
      severity: 'warning',
      file,
      message: `Project instructions in ${file} may constrain migration edits and verification commands.`,
      recommendedAction: `Read ${file} before proposing or applying migration changes.`,
    });
  }
}

function inspectSymlinks(symlinks, findings) {
  for (const file of symlinks) {
    addFinding(findings, {
      code: 'SYMLINK_NOT_DISCOVERED',
      classification: 'unsupported',
      severity: 'warning',
      file,
      message: 'Mastra file discovery skips symlinked entries.',
      recommendedAction: 'Use a real file/directory or retain explicit code registration.',
    });
  }
}

function inspectSourceText(sources, findings, inventory) {
  const dynamicProperties = ['instructions', 'tools', 'skills', 'scorers', 'agents', 'memory', 'workspace', 'inputProcessors', 'outputProcessors'];

  for (const [file, source] of sources) {
    const extension = path.extname(file);
    const testFile = isTestFile(file);
    const isMastraSource = SOURCE_EXTENSIONS.has(extension);
    if (!isMastraSource) continue;
    const masked = maskSource(source);
    const code = masked.code;
    for (const templateIndex of masked.templateExpressionStarts) {
      const expression = templateExpressionAt(source, templateIndex);
      const boundaryUnknown = expression === null;
      if (!boundaryUnknown && !/\b(?:getAgent|getWorkflow|getScorer|new\s+Mastra|new\s+Agent|createTool|createWorkflow|createScorer|schedules?)\b/.test(expression)) continue;
      addFinding(findings, {
        code: 'TEMPLATE_EXPRESSION_NEEDS_REVIEW',
        classification: 'needs-review',
        severity: 'warning',
        file,
        line: lineForIndex(source, templateIndex),
        message: 'Template-literal expressions are not semantically parsed and may contain runtime registration or lookup logic.',
        recommendedAction: 'Review each ${...} expression manually before renaming keys or removing code registration.',
      });
    }

    const detections = [
      ['newMastra', /\bnew\s+Mastra\s*\(/g],
      ['agents', /\bnew\s+Agent\s*\(/g],
      ['tools', /\bcreateTool\s*\(/g],
      ['workflows', /\bcreateWorkflow\s*\(/g],
      ['scorers', /\bcreateScorer\s*\(/g],
      ['memory', /\bnew\s+Memory\s*\(/g],
      ['workspace', /\b(?:new\s+Workspace|workspace\s*:)/g],
    ];
    for (const [key, regex] of detections) {
      const matches = [...code.matchAll(regex)];
      inventory[key] += matches.length;
    }

    const mastraShapes = mastraConstructorShapes(code);
    const mastraMatch = /\bnew\s+Mastra\s*\(/.exec(code);
    if (mastraMatch) {
      addFinding(findings, {
        code: 'CODE_MASTRA_REGISTRATION',
        classification: 'needs-review',
        severity: 'warning',
        file,
        line: lineForIndex(source, mastraMatch.index),
        message: 'Code-defined Mastra registration requires key-by-key migration review.',
        recommendedAction: 'Inventory registration maps, retain unsupported wiring, and compare against file-derived keys.',
      });
      for (const index of mastraShapes.dynamicArguments) {
        addFinding(findings, {
          code: 'DYNAMIC_MASTRA_CONFIG_NEEDS_REVIEW',
          classification: 'needs-review',
          severity: 'warning',
          file,
          line: lineForIndex(source, index),
          message: 'The Mastra constructor argument is not a directly inspectable object literal.',
          recommendedAction: 'Resolve the constructor argument semantically and inventory all runtime registrations before editing.',
        });
      }

      const singletonLabels = {
        storage: 'storage.ts',
        observability: 'observability.ts',
        logger: 'logger.ts',
        server: 'server.ts',
        studio: 'studio.ts',
      };
      for (const [start, end] of mastraShapes.objectRanges) {
        const objectCode = code.slice(start, end);
        const originalObject = source.slice(start, end);
        const properties = topLevelObjectProperties(objectCode, originalObject);
        for (const [property, target] of Object.entries(singletonLabels)) {
          const registered = properties.find(item => item.key === property);
          if (!registered) continue;
          addFinding(findings, {
            code: 'SINGLETON_MIGRATION_CANDIDATE',
            classification: 'supported',
            severity: 'info',
            file,
            line: lineForIndex(source, start + registered.start),
            message: `Code-defined ${property} has an installed file convention.`,
            recommendedAction: `Review precedence and consider a default export from src/mastra/${target}.`,
          });
        }

        const scorer = properties.find(item => item.key === 'scorers');
        if (scorer) {
          addFinding(findings, {
            code: 'GLOBAL_SCORERS_UNSUPPORTED',
            classification: 'unsupported',
            severity: 'warning',
            file,
            line: lineForIndex(source, start + scorer.start),
            message: 'Project-wide scorer registration has no documented top-level file convention, regardless of whether its map is literal, shorthand, quoted, or identifier-valued.',
            recommendedAction: 'Retain global scorer registration in code; expand and inventory its keys before migrating per-agent scorer wiring.',
          });
        }

        const dynamic = properties.find(item => item.kind === 'spread' || item.kind === 'computed');
        if (dynamic) {
          addFinding(findings, {
            code: 'DYNAMIC_REGISTRATION_MAP_NEEDS_REVIEW',
            classification: 'needs-review',
            severity: 'warning',
            file,
            line: lineForIndex(source, start + dynamic.start),
            message: 'Spread or computed Mastra registration properties may hide agents, workflows, scorers, or other runtime wiring.',
            recommendedAction: 'Resolve the registration map semantically and disclose any unsupported global scorers before editing.',
          });
        }
      }
    }

    const agentMatch = /\bnew\s+Agent\s*\(/.exec(code);
    if (agentMatch && !testFile) {
      addFinding(findings, {
        code: 'AGENT_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, agentMatch.index),
        message: 'Code-defined Agent is a candidate for incremental file-based migration.',
        recommendedAction: 'Map its registration key and move only statically representable capabilities.',
      });
      const instructionsMatch = /\binstructions\s*:\s*(['"`])/.exec(code);
      if (instructionsMatch) {
        addFinding(findings, {
          code: 'STATIC_INSTRUCTIONS_MIGRATION_CANDIDATE',
          classification: 'supported',
          severity: 'info',
          file,
          line: lineForIndex(source, instructionsMatch.index),
          message: 'Statically visible agent instructions may be moved to instructions.md.',
          recommendedAction: 'Preserve exact prompt content and verify no dynamic instruction precedence applies.',
        });
      }
    }

    const toolMatch = /\bcreateTool\s*\(/.exec(code);
    if (toolMatch && !testFile && !/\/agents\/.*\/tools\/[^/]+\.(?:ts|js)$/.test(file)) {
      addFinding(findings, {
        code: 'TOOL_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, toolMatch.index),
        message: 'Code-defined tool may be moved to a direct agent tools file.',
        recommendedAction: 'Preserve the tool key and default-export it from a direct tools/ child.',
      });
    }

    const workflowMatch = /\bcreateWorkflow\s*\(/.exec(code);
    if (workflowMatch && !testFile) {
      addFinding(findings, {
        code: 'WORKFLOW_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, workflowMatch.index),
        message: 'Workflow source is eligible for file routing when directly under workflows/ with a default export.',
        recommendedAction: 'Preserve the registration key through the filename and add a default export.',
      });
    }

    const memoryMatch = /\bnew\s+Memory\s*\(/.exec(code);
    if (memoryMatch && !testFile) {
      addFinding(findings, {
        code: 'MEMORY_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, memoryMatch.index),
        message: 'Agent memory may be represented by an agent-local memory.ts file.',
        recommendedAction: 'Confirm ownership and precedence before default-exporting the memory configuration.',
      });
    }

    const workspaceMatch = /\b(?:new\s+Workspace|workspace\s*:)/.exec(code);
    if (workspaceMatch && !testFile && /\bnew\s+Agent\s*\(/.test(code)) {
      addFinding(findings, {
        code: 'WORKSPACE_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, workspaceMatch.index),
        message: 'Agent workspace configuration may be represented by workspace.ts.',
        recommendedAction: 'Verify config precedence, seed files, filesystem, and sandbox behavior before migration.',
      });
    }

    const scorerDefinitionMatch = /\bcreateScorer\s*\(/.exec(code);
    if (scorerDefinitionMatch && !testFile) {
      addFinding(findings, {
        code: 'SCORER_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, scorerDefinitionMatch.index),
        message: 'Scorer definition may be eligible for agent-local file discovery.',
        recommendedAction: 'Distinguish per-agent sampling from project-wide registration before moving it.',
      });
    }

    const processorMatch = /\b(?:create[A-Za-z]*Processor|inputProcessors\s*:|outputProcessors\s*:)/.exec(code);
    if (processorMatch && !testFile) {
      addFinding(findings, {
        code: 'PROCESSOR_MIGRATION_CANDIDATE',
        classification: 'supported',
        severity: 'info',
        file,
        line: lineForIndex(source, processorMatch.index),
        message: 'Processor configuration may be eligible for an agent-local processors file.',
        recommendedAction: 'Preserve processor order and confirm static merge precedence before migration.',
      });
    }

    for (const property of dynamicProperties) {
      const regex = new RegExp(`\\b${property}\\s*:\\s*(?:async\\s*)?(?:function\\b|(?:\\([^)]*\\)|[A-Za-z_$][\\w$]*)\\s*=>)`);
      const match = regex.exec(code);
      if (!match) continue;
      addFinding(findings, {
        code: 'DYNAMIC_CONFIG_NEEDS_REVIEW',
        classification: 'needs-review',
        severity: 'warning',
        file,
        line: lineForIndex(source, match.index),
        message: `Function-valued ${property} cannot be safely evaluated or statically merged by this audit.`,
        recommendedAction: 'Retain the function in code until installed precedence and runtime behavior are proven.',
      });
    }

    const scheduleRegex = /\b(?:mastra\.)?schedules?\s*\.\s*(?:create|add|register)\s*\(/g;
    for (const match of code.matchAll(scheduleRegex)) {
      addFinding(findings, {
        code: 'SCHEDULES_UNSUPPORTED',
        classification: 'unsupported',
        severity: 'warning',
        file,
        line: lineForIndex(source, match.index),
        message: 'Schedules do not have an installed file-based convention.',
        recommendedAction: 'Retain schedule creation and its runtime dependencies in code.',
      });
    }

    const lookupRegex = /\bget(Agent|Workflow|Scorer)\s*\(\s*(['"])([^'"]+)\2\s*\)/g;
    for (const match of masked.commentsMasked.matchAll(lookupRegex)) {
      if (!masked.isCodeIndex(match.index)) continue;
      addFinding(findings, {
        code: 'REGISTRATION_KEY_LOOKUP',
        classification: 'needs-review',
        severity: 'warning',
        file,
        line: lineForIndex(source, match.index),
        message: `${match[1]} lookup depends on registration key "${match[3]}".`,
        recommendedAction: `Preserve "${match[3]}" or update every caller and prove the real runtime lookup.`,
      });
    }

    const directImportRegex = /(?:from\s*|require\s*\()(['"])(\.[^'"]*(?:agents|workflows|tools|scorers)\/[^'"]+)\1/g;
    for (const match of masked.commentsMasked.matchAll(directImportRegex)) {
      if (!masked.isCodeIndex(match.index)) continue;
      addFinding(findings, {
        code: 'DIRECT_IMPORT_DISCOVERY_BYPASS',
        classification: 'needs-review',
        severity: 'warning',
        file,
        line: lineForIndex(source, match.index),
        message: `Direct primitive import "${match[2]}" may bypass or depend on code registration.`,
        recommendedAction: 'Trace this consumer and prove it runs through Mastra CLI discovery before removing the imported export.',
      });
    }
  }
}

function inspectFileConventions(files, sources, findings) {
  const agents = fileBasedAgentDirectories(files);
  const agentRoots = new Set();
  const markerRoutes = [...new Map(files
    .map(agentRoute)
    .filter(route => route && route.remaining.length === 1 && /^(?:config\.(?:ts|js)|instructions\.md)$/.test(route.remaining[0]))
    .map(route => [route.root, route])).values()]
    .sort((a, b) => a.subagentDepth - b.subagentDepth);
  for (const route of markerRoutes) {
    const hasConfig = files.some(file => file === `${route.root}/config.ts` || file === `${route.root}/config.js`);
    const hasInstructions = files.includes(`${route.root}/instructions.md`);
    if (!hasConfig || !hasInstructions) continue;
    if (route.subagentDepth === 0) {
      agentRoots.add(route.root);
      continue;
    }
    const parentRoot = route.root.slice(0, route.root.lastIndexOf('/subagents/'));
    if (route.subagentDepth <= 3 && agentRoots.has(parentRoot)) agentRoots.add(route.root);
  }
  for (const [agentKey, markerFiles] of agents) {
    const directory = `src/mastra/agents/${agentKey}`;
    const configFile = [...markerFiles].find(value => value.startsWith('config.'));
    const instructionsFile = markerFiles.has('instructions.md');
    if (!configFile || !instructionsFile) {
      addFinding(findings, {
        code: configFile ? 'AGENT_INSTRUCTIONS_REQUIRED' : 'AGENT_CONFIG_REQUIRED',
        classification: 'needs-review',
        severity: 'warning',
        file: directory,
        message: configFile ? 'The agent directory is missing instructions.md.' : 'The agent directory is missing config.ts or config.js.',
        recommendedAction: 'Add both required agent files using the installed convention before treating this route as discoverable.',
      });
      continue;
    }
    addFinding(findings, {
      code: 'FILE_BASED_AGENT_PRESENT',
      classification: 'supported',
      severity: 'info',
      file: directory,
      message: `Existing file-based agent candidate uses registration key "${agentKey}".`,
      recommendedAction: 'Verify installed build requirements and preserve this key during mixed-mode changes.',
    });

    if (configFile) {
      const fullConfig = `${directory}/${configFile}`;
      const configSource = sources.get(fullConfig) ?? '';
      const configCode = maskSource(configSource).code;
      if (!hasDefaultExport(configSource)) {
        addFinding(findings, {
          code: 'AGENT_DEFAULT_EXPORT_REQUIRED',
          classification: 'supported',
          severity: 'warning',
          file: fullConfig,
          message: 'Agent config is not visibly default-exported.',
          recommendedAction: 'Default-export agentConfig(...) or a deliberately code-defined Agent supported by the installed version.',
        });
      }
      if (/\bexport\s+default\s+new\s+Agent\s*\(/.test(configCode)) {
        const siblingPrefix = `${directory}/`;
        const hasSiblingCapabilities = files.some(file => file.startsWith(siblingPrefix) && file !== fullConfig && !file.endsWith('/instructions.md'));
        if (hasSiblingCapabilities || instructionsFile) {
          addFinding(findings, {
            code: 'CODE_DEFINED_AGENT_BYPASSES_FILES',
            classification: 'needs-review',
            severity: 'warning',
            file: fullConfig,
            message: 'A default-exported Agent instance can bypass sibling file-based capabilities.',
            recommendedAction: 'Confirm installed short-circuit behavior; retain or convert the Agent deliberately rather than assuming merges.',
          });
        }
      }
    }
  }

  for (const file of files) {
    const extension = path.extname(file);
    const route = agentRoute(file);
    const validRoute = route && agentRoots.has(route.root);
    const remaining = route?.remaining ?? [];
    const capabilitySegments = new Set(['tools', 'processors', 'scorers', 'memory.ts', 'memory.js', 'workspace.ts', 'workspace.js', 'skills', 'subagents']);
    const firstCapabilityIndex = remaining.findIndex(part => capabilitySegments.has(part));
    if (route && firstCapabilityIndex >= 0 && (!validRoute || firstCapabilityIndex > 0)) {
      addFinding(findings, {
        code: 'MISPLACED_AGENT_CAPABILITY_NOT_DISCOVERED',
        classification: 'unsupported',
        severity: 'warning',
        file,
        message: 'Agent capability paths must be direct children of a valid agent or subagent root.',
        recommendedAction: 'Move the capability to the documented direct-child location or retain explicit code registration.',
      });
    }

    if (validRoute && remaining[0] === 'tools') {
      const depthAfterTools = remaining.length - 1;
      if (depthAfterTools > 1 && SOURCE_EXTENSIONS.has(extension)) {
        addFinding(findings, {
          code: 'NESTED_TOOL_NOT_DISCOVERED',
          classification: 'unsupported',
          severity: 'warning',
          file,
          message: 'Nested tool modules are not discovered.',
          recommendedAction: 'Flatten the tool to a direct tools/ child or retain explicit code registration.',
        });
      } else if (depthAfterTools === 1 && ROUTED_EXTENSIONS.has(extension) && !isTestFile(file)) {
        if (!hasDefaultExport(sources.get(file) ?? '')) {
          addFinding(findings, {
            code: 'TOOL_DEFAULT_EXPORT_REQUIRED',
            classification: 'supported',
            severity: 'warning',
            file,
            message: 'Direct tool file is discoverable by path but lacks a visible default export.',
            recommendedAction: 'Default-export the createTool(...) result.',
          });
        } else {
          addFinding(findings, {
            code: 'FILE_BASED_TOOL_PRESENT',
            classification: 'supported',
            severity: 'info',
            file,
            message: 'Direct default-exported agent tool follows the installed path convention.',
            recommendedAction: 'Verify its filename-derived key and runtime behavior.',
          });
        }
      }
    }

    for (const folder of ['processors', 'scorers']) {
      if (!validRoute || remaining[0] !== folder) continue;
      const depthAfterFolder = remaining.length - 1;
      if (depthAfterFolder !== 1 || !ROUTED_EXTENSIONS.has(extension) || isTestFile(file)) continue;
      const singular = folder === 'processors' ? 'PROCESSOR' : 'SCORER';
      if (hasDefaultExport(sources.get(file) ?? '')) {
        addFinding(findings, {
          code: `FILE_BASED_${singular}_PRESENT`,
          classification: 'supported',
          severity: 'info',
          file,
          message: `Direct default-exported per-agent ${folder.slice(0, -1)} follows the installed path convention.`,
          recommendedAction: 'Verify config collision precedence, key identity, and execution/sampling behavior.',
        });
      } else {
        addFinding(findings, {
          code: `${singular}_DEFAULT_EXPORT_REQUIRED`,
          classification: 'supported',
          severity: 'warning',
          file,
          message: `Direct per-agent ${folder.slice(0, -1)} file lacks a visible default export.`,
          recommendedAction: `Default-export the installed ${folder.slice(0, -1)} shape before relying on discovery.`,
        });
      }
    }

    if (validRoute && remaining.length === 1 && /^(?:memory|workspace)\.(?:ts|js)$/.test(remaining[0])) {
      const primitive = path.basename(file, extension);
      const defaultExport = hasDefaultExport(sources.get(file) ?? '');
      addFinding(findings, {
        code: defaultExport ? `FILE_BASED_${primitive.toUpperCase()}_PRESENT` : `${primitive.toUpperCase()}_DEFAULT_EXPORT_REQUIRED`,
        classification: 'supported',
        severity: defaultExport ? 'info' : 'warning',
        file,
        message: defaultExport
          ? `Agent-local ${path.basename(file)} follows the installed path convention.`
          : `Agent-local ${path.basename(file)} lacks a visible default export.`,
        recommendedAction: `Verify config.${primitive} precedence and default-export the intended instance.`,
      });
    }

    if (validRoute && remaining.length === 3 && remaining[0] === 'skills' && remaining[2] === 'SKILL.md') {
      addFinding(findings, {
        code: 'FILE_BASED_SKILL_PRESENT',
        classification: 'supported',
        severity: 'info',
        file,
        message: 'Packaged agent skill is present under an agent skills directory.',
        recommendedAction: 'Validate the Agent Skill package and check config.skills collision precedence.',
      });
    }

    const subagentDepth = route?.subagentDepth ?? 0;
    const isAgentMarker = remaining.length === 1 && /^(?:config\.(?:ts|js)|instructions\.md)$/.test(remaining[0]);
    if (route && !validRoute && subagentDepth > 0 && subagentDepth <= 3 && isAgentMarker) {
      addFinding(findings, {
        code: 'ORPHAN_SUBAGENT_NOT_DISCOVERED',
        classification: 'unsupported',
        severity: 'warning',
        file: route.root,
        message: 'Subagent markers are present but the discoverable parent agent/subagent chain is incomplete.',
        recommendedAction: 'Add valid markers to every parent agent in the direct chain or retain the child in code.',
      });
    }
    if (validRoute && subagentDepth > 0 && subagentDepth <= 3 && isAgentMarker) {
      addFinding(findings, {
        code: 'FILE_BASED_SUBAGENT_PRESENT',
        classification: 'supported',
        severity: 'info',
        file: route.root,
        message: `Subagent directory is within the installed depth limit (${subagentDepth}).`,
        recommendedAction: 'Verify a non-empty description, isolation boundaries, and parent key collisions.',
      });
    }
    if (subagentDepth > 3) {
      addFinding(findings, {
        code: 'SUBAGENT_DEPTH_UNSUPPORTED',
        classification: 'unsupported',
        severity: 'warning',
        file,
        message: `Subagent path is nested ${subagentDepth} levels below the top-level agent; installed discovery supports at most three.`,
        recommendedAction: 'Flatten the hierarchy or retain deeper delegation in code.',
      });
    }

    if (isTestFile(file) && /\/(?:tools|processors|scorers|workflows)\//.test(`/${file}`)) {
      addFinding(findings, {
        code: 'TEST_FILE_NOT_DISCOVERED',
        classification: 'unsupported',
        severity: 'info',
        file,
        message: 'Test/spec files are intentionally skipped by file discovery.',
        recommendedAction: 'Keep tests as tests; do not rely on them as routed production primitives.',
      });
    }
  }

  for (const file of workflowFiles(files)) {
    const source = sources.get(file) ?? '';
    if (hasDefaultExport(source)) {
      addFinding(findings, {
        code: 'FILE_BASED_WORKFLOW_PRESENT',
        classification: 'supported',
        severity: 'info',
        file,
        message: `Default-exported workflow is file-routable under key "${path.basename(file, path.extname(file))}".`,
        recommendedAction: 'Verify code-registration collisions and lookup strings for this key.',
      });
    } else {
      const code = maskSource(source).code;
      if (!/\bcreateWorkflow\s*\(/.test(code)) continue;
      addFinding(findings, {
        code: 'WORKFLOW_DEFAULT_EXPORT_REQUIRED',
        classification: 'supported',
        severity: 'warning',
        file,
        message: 'Workflow file is named-exported or otherwise lacks a visible default export required for file routing.',
        recommendedAction: 'Add a default export while preserving the filename-derived registration key.',
      });
    }
  }

  for (const singleton of SINGLETONS) {
    for (const extension of ['.ts', '.js']) {
      const file = `src/mastra/${singleton}${extension}`;
      if (!files.includes(file)) continue;
      if (!hasDefaultExport(sources.get(file) ?? '')) {
        addFinding(findings, {
          code: 'SINGLETON_DEFAULT_EXPORT_REQUIRED',
          classification: 'supported',
          severity: 'warning',
          file,
          message: `${singleton}${extension} requires a default export for file routing.`,
          recommendedAction: 'Add the installed singleton default export and verify code-registration precedence.',
        });
      } else {
        addFinding(findings, {
          code: 'FILE_BASED_SINGLETON_PRESENT',
          classification: 'supported',
          severity: 'info',
          file,
          message: `${singleton}${extension} has a visible default export.`,
          recommendedAction: 'Verify collision precedence before removing equivalent code registration.',
        });
      }
    }
  }
}

function inspectCollisions(files, sources, findings) {
  const registrations = registrationSurfaces(sources);
  const agents = fileBasedAgentDirectories(files);
  const workflows = new Set(workflowFiles(files).map(file => path.basename(file, path.extname(file))));

  for (const key of registrations.agents) {
    if (!agents.has(key)) continue;
    addFinding(findings, {
      code: 'MIXED_REGISTRATION_COLLISION',
      classification: 'needs-review',
      severity: 'warning',
      file: `src/mastra/agents/${key}`,
      message: `Agent key "${key}" appears in code registration and file discovery.`,
      recommendedAction: 'Confirm installed precedence and remove only the definition proven redundant.',
    });
  }
  for (const key of registrations.workflows) {
    if (!workflows.has(key)) continue;
    addFinding(findings, {
      code: 'MIXED_REGISTRATION_COLLISION',
      classification: 'needs-review',
      severity: 'warning',
      file: `src/mastra/workflows/${key}`,
      message: `Workflow key "${key}" appears in code registration and file discovery.`,
      recommendedAction: 'Code registration wins collisions; preserve behavior and remove duplicates deliberately.',
    });
  }

  return registrations;
}

function deduplicateAndSort(findings) {
  const seen = new Set();
  const unique = [];
  for (const item of findings) {
    const key = [item.code, item.classification, item.file, item.line ?? '', item.message].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  unique.sort((a, b) => {
    return CLASSIFICATION_ORDER.get(a.classification) - CLASSIFICATION_ORDER.get(b.classification)
      || a.file.localeCompare(b.file)
      || (a.line ?? 0) - (b.line ?? 0)
      || a.code.localeCompare(b.code);
  });
  return unique;
}

function buildSummary(findings) {
  const summary = { total: findings.length, supported: 0, unsupported: 0, needsReview: 0 };
  for (const item of findings) {
    if (item.classification === 'supported') summary.supported += 1;
    if (item.classification === 'unsupported') summary.unsupported += 1;
    if (item.classification === 'needs-review') summary.needsReview += 1;
  }
  return summary;
}

async function auditProject(projectDirectory) {
  const projectRoot = path.resolve(projectDirectory);
  let rootInfo;
  try {
    rootInfo = await lstat(projectRoot);
  } catch (error) {
    throw new AuditOperationalError(`Cannot access project path ${projectRoot}: ${error.message}`);
  }
  if (!rootInfo.isDirectory()) {
    throw new AuditOperationalError(`Project path is not a directory: ${projectRoot}`);
  }

  const packagePath = path.join(projectRoot, 'package.json');
  let packageJson;
  try {
    packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  } catch (error) {
    throw new AuditOperationalError(`Cannot read valid package.json at ${packagePath}: ${error.message}`);
  }

  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
    ...(packageJson.optionalDependencies ?? {}),
  };
  const versions = {
    core: dependencies['@mastra/core'] ?? null,
    mastra: dependencies.mastra ?? null,
  };

  const instructionFiles = [];
  for (const file of INSTRUCTION_FILES) {
    if (await pathType(path.join(projectRoot, file)) === 'file') instructionFiles.push(file);
  }

  const findings = [];
  inspectInstructionFiles(instructionFiles, findings);
  const mastraRoot = path.join(projectRoot, 'src', 'mastra');
  const mastraType = await pathType(mastraRoot);
  const inventory = { newMastra: 0, agents: 0, tools: 0, workflows: 0, scorers: 0, memory: 0, workspace: 0, registrationKeys: { agents: [], workflows: [], globalScorers: [] } };

  let files = [];
  let directories = [];
  let symlinks = [];
  if (mastraType !== 'directory') {
    addFinding(findings, {
      code: 'NONSTANDARD_MASTRA_LAYOUT',
      classification: 'needs-review',
      severity: 'warning',
      file: '.',
      message: versions.core || versions.mastra
        ? 'Mastra dependency found, but src/mastra is not a readable directory.'
        : 'No conventional src/mastra directory or declared Mastra dependency was found.',
      recommendedAction: 'Locate the real Mastra entrypoint and direct-library consumers manually before planning migration.',
    });
  } else {
    ({ files, directories, symlinks } = await collectMastraEntries(mastraRoot, projectRoot));
    const sources = await readSources(projectRoot, files);
    inspectSymlinks(symlinks, findings);
    inspectSourceText(sources, findings, inventory);
    inspectFileConventions(files, sources, findings);
    const registrations = inspectCollisions(files, sources, findings);
    inventory.registrationKeys = {
      agents: [...registrations.agents].sort(),
      workflows: [...registrations.workflows].sort(),
      globalScorers: [...registrations.globalScorers].sort(),
    };
  }

  const sortedFindings = deduplicateAndSort(findings);
  return {
    schemaVersion: 1,
    project: {
      root: projectRoot,
      name: typeof packageJson.name === 'string' ? packageJson.name : null,
      packageJson: 'package.json',
      mastraDirectory: mastraType === 'directory' ? 'src/mastra' : null,
      versions,
      instructionFiles,
      sourceFileCount: files.length,
      directoryCount: directories.length,
    },
    summary: buildSummary(sortedFindings),
    inventory,
    findings: sortedFindings,
    limitations: [LIMITATION],
  };
}

function printHuman(report) {
  const { project, summary } = report;
  console.log(`Mastra migration audit: ${project.name ?? path.basename(project.root)}`);
  console.log(`Project: ${project.root}`);
  console.log(`Versions: @mastra/core=${project.versions.core ?? 'not declared'}, mastra=${project.versions.mastra ?? 'not declared'}`);
  console.log(`Summary: unsupported=${summary.unsupported}, needs-review=${summary.needsReview}, supported=${summary.supported}`);

  for (const classification of CLASSIFICATIONS) {
    const group = report.findings.filter(item => item.classification === classification);
    if (group.length === 0) continue;
    console.log(`\n${classification.toUpperCase()} (${group.length})`);
    for (const item of group) {
      const location = `${item.file}${item.line ? `:${item.line}` : ''}`;
      console.log(`- ${item.code} ${location} — ${item.message}`);
      console.log(`  Action: ${item.recommendedAction}`);
    }
  }

  console.log(`\nLIMITATION: ${report.limitations[0]}`);
}

async function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        project: { type: 'string' },
        format: { type: 'string', default: 'human' },
        help: { type: 'boolean', short: 'h', default: false },
      },
      allowPositionals: false,
      strict: true,
    }));
  } catch (error) {
    console.error(error.message);
    console.error('Use --help for usage.');
    process.exitCode = 1;
    return;
  }

  if (values.help) {
    console.log(usage());
    return;
  }
  if (!values.project) {
    console.error('--project is required. Use --help for usage.');
    process.exitCode = 1;
    return;
  }
  if (!['human', 'json'].includes(values.format)) {
    console.error('--format must be "human" or "json"');
    process.exitCode = 1;
    return;
  }

  try {
    const report = await auditProject(values.project);
    if (values.format === 'json') console.log(JSON.stringify(report, null, 2));
    else printHuman(report);
  } catch (error) {
    console.error(error instanceof AuditOperationalError ? error.message : `Audit failed: ${error.message}`);
    process.exitCode = 1;
  }
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) await main();

export { AuditOperationalError, auditProject, buildSummary, findObjectKeys, hasDefaultExport, lineForIndex };
