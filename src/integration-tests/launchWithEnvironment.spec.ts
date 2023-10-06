/*********************************************************************
 * Copyright (c) 2023 Renesas Electronics Corporation and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

import { expect } from 'chai';
import * as path from 'path';
import { LaunchRequestArguments } from '../GDBDebugSession';
import { CdtDebugClient } from './debugClient';
import {
    fillDefaults,
    getCharStringVariableValue,
    getScopes,
    hardwareBreakpoint,
    isRemoteTest,
    standardBeforeEach,
    testProgramsDir,
    verifyCharStringVariable,
} from './utils';
import { platform } from 'os';

const debugAdapter = 'debugAdapter.js';
const debugTargetAdapter = 'debugTargetAdapter.js';

describe.only('launch with environment', function () {
    let dc: CdtDebugClient | undefined;
    const runForEnvironmentTest = async (
        adapter?: string,
        test?: Mocha.Runnable | undefined,
        environment?: Record<string, string | null> | undefined,
        targetEnvironment?: Record<string, string | null> | undefined
    ) => {
        dc = await standardBeforeEach(adapter || debugAdapter);
        await dc.launchRequest(
            fillDefaults(test, {
                program: path.join(
                    testProgramsDir,
                    platform() === 'win32' ? 'vars_env.exe' : 'vars_env'
                ),
                environment: environment,
                target: {
                    environment: targetEnvironment,
                },
            } as LaunchRequestArguments)
        );

        const bpResp = await dc.setBreakpointsRequest({
            source: {
                name: 'vars_env.c',
                path: path.join(testProgramsDir, 'vars_env.c'),
            },
            breakpoints: [
                {
                    column: 1,
                    line: 22,
                },
            ],
        });
        expect(bpResp.body.breakpoints.length).eq(1);
        expect(bpResp.body.breakpoints[0].verified).eq(true);
        expect(bpResp.body.breakpoints[0].message).eq(undefined);
        await dc.configurationDoneRequest();
        await dc.waitForEvent('stopped');
        const scope = await getScopes(dc);
        const vr = scope.scopes.body.scopes[0].variablesReference;
        const vars = await dc.variablesRequest({ variablesReference: vr });
        const VARPATH = vars.body.variables.find((i) => i.name === 'path');
        const VARTEST1 = vars.body.variables.find((i) => i.name === 'test1');
        const VARTEST2 = vars.body.variables.find((i) => i.name === 'test2');
        const VARTEST3 = vars.body.variables.find((i) => i.name === 'test3');
        const VARTEST4 = vars.body.variables.find((i) => i.name === 'test4');
        expect(VARPATH).not.equals(undefined, 'Variable `path` not found');
        expect(VARTEST1).not.equals(undefined, 'Variable `test1` not found');
        expect(VARTEST2).not.equals(undefined, 'Variable `test2` not found');
        expect(VARTEST3).not.equals(undefined, 'Variable `test3` not found');
        expect(VARTEST4).not.equals(undefined, 'Variable `test4` not found');
        if (!VARPATH || !VARTEST1 || !VARTEST2 || !VARTEST3 || !VARTEST4) {
            // This line is not expected to be executed
            // This logic exists only for returning non null/non undefined values
            throw new Error('One of the variables not found in vars_env.c');
        }

        return {
            VARPATH,
            VARTEST1,
            VARTEST2,
            VARTEST3,
            VARTEST4,
        };
    };

    afterEach(async function () {
        // dc could be undefined if test is skipped.
        await dc?.stop();
        dc = undefined;
    });

    it('sets environment variables passed to the process', async function () {
        if (hardwareBreakpoint) {
            this.skip();
        }
        const environment = {
            VARTEST1: 'TEST1',
            VARTEST2: 'TEST2',
            VARTEST3: 'TEST3',
            VARTEST4: 'TEST4',
        };

        const results = await runForEnvironmentTest(
            undefined,
            this.test,
            environment
        );

        verifyCharStringVariable(results.VARTEST1, 'char *', 'TEST1');
        verifyCharStringVariable(results.VARTEST2, 'char *', 'TEST2');
        verifyCharStringVariable(results.VARTEST3, 'char *', 'TEST3');
        verifyCharStringVariable(results.VARTEST4, 'char *', 'TEST4');
    });

    it('not sets target environment variables passed to the process when debugAdapter used', async function () {
        if (hardwareBreakpoint || (platform() === 'win32' && !isRemoteTest)) {
            this.skip();
        }
        const environment = {
            VARTEST1: 'TEST1',
            VARTEST2: 'TEST2',
        };
        const targetEnvironment = {
            VARTEST1: 'TEST1_SOMEDIFFERENT_VALUE',
            VARTEST2: 'TEST2_SOMEDIFFERENT_VALUE',
            VARTEST3: 'TEST3_SOMEDIFFERENT_VALUE',
            VARTEST4: 'TEST4_SOMEDIFFERENT_VALUE',
        };

        const results = await runForEnvironmentTest(
            undefined,
            this.test,
            environment,
            targetEnvironment
        );

        verifyCharStringVariable(results.VARTEST1, 'char *', 'TEST1');
        verifyCharStringVariable(results.VARTEST2, 'char *', 'TEST2');
        verifyCharStringVariable(results.VARTEST3, 'char *', null);
        verifyCharStringVariable(results.VARTEST4, 'char *', null);
    });

    it('sets target environment variables with debugTargetAdapter', async function () {
        if (hardwareBreakpoint) {
            this.skip();
        }
        const environment = {
            VARTEST1: 'TEST1',
            VARTEST2: 'TEST2',
        };
        const targetEnvironment = {
            VARTEST1: 'TEST1_SOMEDIFFERENT_VALUE',
            VARTEST2: 'TEST2_SOMEDIFFERENT_VALUE',
            VARTEST3: 'TEST3_SOMEDIFFERENT_VALUE',
            VARTEST4: 'TEST4_SOMEDIFFERENT_VALUE',
        };

        const results = await runForEnvironmentTest(
            debugTargetAdapter,
            this.test,
            environment,
            targetEnvironment
        );

        verifyCharStringVariable(
            results.VARTEST1,
            'char *',
            'TEST1_SOMEDIFFERENT_VALUE'
        );
        verifyCharStringVariable(
            results.VARTEST2,
            'char *',
            'TEST2_SOMEDIFFERENT_VALUE'
        );
        verifyCharStringVariable(
            results.VARTEST3,
            'char *',
            'TEST3_SOMEDIFFERENT_VALUE'
        );
        verifyCharStringVariable(
            results.VARTEST4,
            'char *',
            'TEST4_SOMEDIFFERENT_VALUE'
        );
    });

    it('unsets when target environment variables sets null with debugTargetAdapter', async function () {
        if (hardwareBreakpoint) {
            this.skip();
        }
        const environment = {
            VARTEST1: 'TEST1',
            VARTEST2: 'TEST2',
            VARTEST3: 'TEST3',
            VARTEST4: 'TEST4',
        };
        const targetEnvironment = {
            VARTEST1: 'TEST1_SOMEDIFFERENT_VALUE',
            VARTEST2: 'TEST2_SOMEDIFFERENT_VALUE',
            VARTEST3: null,
            VARTEST4: null,
        };

        const results = await runForEnvironmentTest(
            debugTargetAdapter,
            this.test,
            environment,
            targetEnvironment
        );

        verifyCharStringVariable(
            results.VARTEST1,
            'char *',
            'TEST1_SOMEDIFFERENT_VALUE'
        );
        verifyCharStringVariable(
            results.VARTEST2,
            'char *',
            'TEST2_SOMEDIFFERENT_VALUE'
        );
        verifyCharStringVariable(results.VARTEST3, 'char *', null);
        verifyCharStringVariable(results.VARTEST4, 'char *', null);
    });

    it('ensures that path is not null', async function () {
        if (hardwareBreakpoint) {
            this.skip();
        }
        const results = await runForEnvironmentTest(undefined, this.test);

        expect(
            results.VARPATH.value,
            `The value of Path is wrong`
        ).not.to.equal('0x00');
    });

    it('ensures that new entries could be injected to path', async function () {
        if (hardwareBreakpoint) {
            this.skip();
        }
        const pathToAppend = __dirname;
        const currentPathValue = process.env.PATH || process.env.Path;
        const environment = {
            PATH: `${pathToAppend}${path.delimiter}${currentPathValue}`,
        };
        const results = await runForEnvironmentTest(
            undefined,
            this.test,
            environment
        );

        expect(
            results.VARPATH.value,
            `The value of Path is wrong`
        ).not.to.equal('0x00');

        console.log('results.VARPATH.value', results.VARPATH.value);

        const valueOfPath = getCharStringVariableValue(results.VARPATH);
        if (platform() === 'win32' || true) {
            // Win32 test platform auto inject another folder to the front of the list.
            // So we have a little bit different test here.
            const entriesInPath = valueOfPath!
                .split(path.delimiter)
                .map((i) => i.replace(/\\\\/g, '\\'));
            expect(
                entriesInPath,
                'Path does not include appended folder'
            ).to.includes(pathToAppend);
        } else {
            const entriesInPath = valueOfPath!.split(path.delimiter);
            expect(entriesInPath[0]).to.equals(pathToAppend);
        }
    });

    it('check setting null will delete the variable', async function () {
        if (platform() === 'win32' || hardwareBreakpoint) {
            this.skip();
        }
        const environment = {
            PATH: null,
        };
        const results = await runForEnvironmentTest(
            undefined,
            this.test,
            environment
        );
        console.log('results.VARPATH.value in delete', results.VARPATH.value);

        verifyCharStringVariable(results.VARPATH, 'char *', null);
    });
});
