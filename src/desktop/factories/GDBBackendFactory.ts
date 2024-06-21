import { Logger, logger } from '@vscode/debugadapter/lib/logger';
import { GDBFileSystemProcessManager } from '../processManagers/GDBFileSystemProcessManager';
import { GDBPTYProcessManager } from '../processManagers/GDBPTYProcessManager';
import { compareVersions } from '../../util/compareVersions';
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

export class GDBBackendFactory implements IGDBBackendFactory {
    logger: Logger;
    constructor() {
        this.logger = logger;
    }

    async createGDBManager(
        session: GDBDebugSessionBase,
        args: LaunchRequestArguments | AttachRequestArguments
    ): Promise<IGDBProcessManager> {
        const defaultProcessManager = new GDBFileSystemProcessManager();
        if (args.openGdbConsole) {
            const version = await defaultProcessManager.getVersion(args);
            if (!session.supportsGdbConsole) {
                logger.warn(
                    'cdt-gdb-adapter: openGdbConsole is not supported on this platform'
                );
            } else if (compareVersions(version, '7.12') < 0) {
                logger.warn(
                    `cdt-gdb-adapter: new-ui command not detected (${
                        args.gdb || 'gdb'
                    })`
                );
            } else {
                logger.verbose(
                    'cdt-gdb-adapter: spawning gdb console in client terminal'
                );
                return new GDBPTYProcessManager(session);
            }
        }
        return defaultProcessManager;
    }

    async createBackend(
        session: GDBDebugSessionBase,
        manager: IGDBProcessManager,
        args: LaunchRequestArguments | AttachRequestArguments
    ): Promise<IGDBBackend> {
        return new GDBBackend(manager);
    }
}
