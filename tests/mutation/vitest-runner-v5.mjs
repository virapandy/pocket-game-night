// A thin wrapper round Stryker's own Vitest runner (PLT-119), for one incompatibility between Stryker 10 and Vitest 5.
//
// The problem: for each deliberate mistake Stryker runs only the tests that reach it, picked by test name. Stryker 10
// writes a test's full name as "group test" (spaces); Vitest 5 compares against "group > test". No name matches, so
// every mistake ran 0 tests and "survived": the first run scored about 3% with no test ever run.
//
// The fix here: keep Stryker's choice of tests, but hand Vitest their test files instead of their names. Each mistake
// then runs every test in the files that reach it: a few more tests than needed, never fewer, so the score is honest.
// Nothing else changes. Remove this file (and the two lines in tests/stryker.config.mjs) once Stryker's Vitest runner
// handles Vitest 5 names.
import { commonTokens, declareFactoryPlugin, PluginKind, tokens } from '@stryker-mutator/api/plugin';
import { strykerPlugins as official } from '@stryker-mutator/vitest-runner';

const createOfficial = official[0].factory;

function createRunner(injector) {
  const runner = createOfficial(injector);
  const mutantRun = runner.mutantRun.bind(runner);
  runner.mutantRun = (options) => {
    const files = options.testFilter && [...new Set(options.testFilter.map((id) => id.split('#')[0]))];
    return mutantRun({ ...options, testFilter: files });
  };
  return runner;
}
createRunner.inject = tokens(commonTokens.injector);

export const strykerPlugins = [declareFactoryPlugin(PluginKind.TestRunner, 'vitest-v5', createRunner)];
