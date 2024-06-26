import { TargetLaunchRequestArguments } from '../../types/session';
import { IGDBServerProcessManager, IStdioProcess } from '../../types/gdb';

export class GDBServerWebProcessManager implements IGDBServerProcessManager {
    public async start(
        requestArgs: TargetLaunchRequestArguments
    ): Promise<IStdioProcess> {
        throw new Error('Method not implemented yet!');
    }
    public async stop(): Promise<void> {
        throw new Error('Method not implemented yet!');
    }
}
