export interface RunResult {
  passed: boolean;
  output: string;
  runtimeMs: number;
  memoryKb: number;
  error?: string;
}

export interface CodeRunner {
  run(sourceCode: string, language: string, input: string, expectedOutput: string): Promise<RunResult>;
}

export class MockCodeRunner implements CodeRunner {
  async run(sourceCode: string, language: string, input: string, expectedOutput: string): Promise<RunResult> {
    if (!sourceCode.trim()) return { passed: false, output: "", runtimeMs: 0, memoryKb: 0, error: "Source code is empty." };
    if (!new Set(["javascript", "python", "java", "c++"]).has(language)) {
      return { passed: false, output: "", runtimeMs: 0, memoryKb: 0, error: "Unsupported language." };
    }
    return {
      passed: true,
      output: expectedOutput,
      runtimeMs: 18,
      memoryKb: 1200,
    };
  }
}
