import { ChildProcess, spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { GDBFileSystemProcessManagerBase } from './GDBFileSystemProcessManagerBase';
import { TargetLaunchRequestArguments } from '../../types/session';
import { createEnvValues } from '../../util/createEnvValues';
import { IGDBServerProcessManager, IStdioProcess } from '../../types/gdb';

export class GDBServerFileSystemProcessManager
    extends GDBFileSystemProcessManagerBase
    implements IGDBServerProcessManager
{
    protected proc?: ChildProcess;
    public gdbVersion?: string;

    protected token = 0;

    protected getCwd(requestArgs: TargetLaunchRequestArguments): string {
        const cwd =
            requestArgs.target?.cwd ||
            requestArgs.cwd ||
            (requestArgs.program && existsSync(requestArgs.program)
                ? dirname(requestArgs.program)
                : process.cwd());
        return existsSync(cwd) ? cwd : process.cwd();
    }

    public async start(
        requestArgs: TargetLaunchRequestArguments
    ): Promise<IStdioProcess> {
        if (requestArgs.target === undefined) {
            requestArgs.target = {};
        }
        const target = requestArgs.target;
        const serverExe =
            target.server !== undefined ? target.server : 'gdbserver';
        const serverCwd = this.getCwd(requestArgs);
        const serverParams =
            target.serverParameters !== undefined
                ? target.serverParameters
                : ['--once', ':0', requestArgs.program];

        // this.killGdbServer = target.automaticallyKillServer !== false;

        const gdbEnvironment = requestArgs.environment
            ? createEnvValues(process.env, requestArgs.environment)
            : process.env;
        const serverEnvironment = target.environment
            ? createEnvValues(gdbEnvironment, target.environment)
            : gdbEnvironment;

        this.proc = spawn(serverExe, serverParams, {
            cwd: serverCwd,
            env: serverEnvironment,
        });
        return this.proc;
    }
    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.proc || this.proc.exitCode !== null) {
                resolve();
            } else {
                this.proc.on('exit', () => {
                    resolve();
                });
                this.proc?.kill();
            }
            setTimeout(() => {
                reject();
            }, 1000);
        });
    }
}
