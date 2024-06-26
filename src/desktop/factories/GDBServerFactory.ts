import { GDBServerFileSystemProcessManager } from '../processManagers/GDBServerFileSystemProcessManager';
import {
    TargetAttachRequestArguments,
    TargetLaunchRequestArguments,
} from '../../types/session';
import { IGDBServerFactory, IGDBServerProcessManager } from '../../types/gdb';

export class GDBServerFactory implements IGDBServerFactory {
    async createGDBServerManager(
        args: TargetLaunchRequestArguments | TargetAttachRequestArguments
    ): Promise<IGDBServerProcessManager> {
        return new GDBServerFileSystemProcessManager();
    }
}
