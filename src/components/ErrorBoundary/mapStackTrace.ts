import { SourceMapConsumer, type SectionedSourceMapInput } from '@jridgewell/source-map';
import { log } from '@/logger/logger.ts';
import { getAxiosInstance } from '@/services/axiosConfig';

type SourceMapCacheEntry = {
  originalFile: SectionedSourceMapInput;
  lastModified: number;
};
const logger = log.getLogger('mapStackTrace');
const axiosInstance = getAxiosInstance();

const sourceMapCache = new Map<string, SourceMapCacheEntry>();

const urlRegex = /(http[s]?:\/\/.*\.js)/;

const HOUR_IN_MS = 1000 * 60 * 60;

export async function getOriginalStackTrace(error: Error): Promise<string[] | undefined> {
  const stackTrace = error.stack;
  if (!stackTrace) return;

  const lines = stackTrace.split('\n');
  const mappedLines: string[] = [];
  for (const line of lines) {
    const mappedLine = await handleStackTraceLine(line);
    mappedLines.push(mappedLine);
  }
  return mappedLines.filter(Boolean);
}

async function handleStackTraceLine(line: string): Promise<string> {
  const match = line.match(urlRegex);
  if (!match) return line;

  const url = match[1];
  const sourceMapUrl = url.replace('.js', '.js.map');
  let sourceMapEntry = sourceMapCache.get(sourceMapUrl);
  if (!sourceMapEntry || sourceMapEntry.lastModified < Date.now() - HOUR_IN_MS) {
    try {
      const response = await axiosInstance.get<SectionedSourceMapInput>(sourceMapUrl);
      sourceMapEntry = { originalFile: response.data, lastModified: Date.now() };
      sourceMapCache.set(sourceMapUrl, sourceMapEntry);
    } catch (error) {
      logger.debug('Error fetching source map', error);
      return line;
    }
  }

  const consumer = new SourceMapConsumer(sourceMapEntry.originalFile, url);
  const splitLine = line.split(':');
  const column = splitLine.pop()!;
  const lineNumber = splitLine.pop()!;

  const position = consumer.originalPositionFor({
    line: parseInt(lineNumber),
    column: parseInt(column),
  });
  consumer.destroy();
  if (!position.source) return line;
  return `${position.source}:${position.line}:${position.column}`;
}
