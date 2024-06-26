import {
    AttachRequestArguments,
    LaunchRequestArguments,
    TargetLaunchRequestArguments,
} from '../../types/session';
import { IGDBProcessManager, IStdioProcess } from '../../types/gdb';

export class GDBWebProcessManager implements IGDBProcessManager {
    public async getVersion(
        requestArgs?:
            | LaunchRequestArguments
            | AttachRequestArguments
            | undefined
    ): Promise<string> {
        throw new Error('Method not implemented yet!');
    }
    public async start(
        requestArgs: TargetLaunchRequestArguments
    ): Promise<IStdioProcess> {
        throw new Error('Method not implemented yet!');
    }
    public async stop(): Promise<void> {
        throw new Error('Method not implemented yet!');
    }
}
