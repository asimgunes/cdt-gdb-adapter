#!/usr/bin/env node
import * as process from 'process';
import { logger } from '@vscode/debugadapter/lib/logger';
import { GDBBackend } from '../../../GDBBackend';
import { GDBTargetDebugSession } from '../../../GDBTargetDebugSession';
import { MIBreakpointLocation, MIBreakpointInsertOptions } from '../../../mi';

process.on('uncaughtException', (err: any) => {
    logger.error(JSON.stringify(err));
});

// Breakpoint options to override
const hardwareBreakpointTrue = process.argv.includes(
    '--hardware-breakpoint-true'
);
const hardwareBreakpointFalse = process.argv.includes(
    '--hardware-breakpoint-false'
);
const throwError = process.argv.includes('--throw-error');

class DynamicBreakpointOptionsGDBBackend extends GDBBackend {
    public async getBreakpointOptions(
        _: MIBreakpointLocation,
        initialOptions: MIBreakpointInsertOptions
    ): Promise<MIBreakpointInsertOptions> {
        if (throwError) {
            throw new Error(
                'Some error message providing information that the breakpoint is not valid!'
            );
        }
        const hardware = hardwareBreakpointTrue
            ? true
            : hardwareBreakpointFalse
            ? false
            : initialOptions.hardware;
        return { ...initialOptions, hardware };
    }
}

class DynamicBreakpointOptionsGDBDebugSession extends GDBTargetDebugSession {
    gdb = this.createBackend();
    protected createBackend(): GDBBackend {
        return new DynamicBreakpointOptionsGDBBackend();
    }
}

DynamicBreakpointOptionsGDBDebugSession.run(
    DynamicBreakpointOptionsGDBDebugSession
);
