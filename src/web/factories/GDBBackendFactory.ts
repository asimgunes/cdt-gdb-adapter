import { Logger, logger } from '@vscode/debugadapter/lib/logger';
import {
    IGDBBackend,
    IGDBBackendFactory,
    IGDBProcessManager,
} from '../../types/gdb';
import {
    AttachRequestArguments,
    LaunchRequestArguments,
} from '../../types/session';
import { GDBBackend } from '../../gdb/GDBBackend';
import { GDBDebugSessionBase } from '../../gdb/GDBDebugSessionBase';
import { GDBWebProcessManager } from '../processManagers/GDBWebProcessManager';

export class GDBBackendFactory implements IGDBBackendFactory {
    logger: Logger;
    constructor() {
        this.logger = logger;
    }

    async createGDBManager(
        session: GDBDebugSessionBase,
        args: LaunchRequestArguments | AttachRequestArguments
    ): Promise<IGDBProcessManager> {
        return new GDBWebProcessManager();
    }

    async createBackend(
        session: GDBDebugSessionBase,
        manager: IGDBProcessManager,
        args: LaunchRequestArguments | AttachRequestArguments
    ): Promise<IGDBBackend> {
        return new GDBBackend(manager);
    }
}
