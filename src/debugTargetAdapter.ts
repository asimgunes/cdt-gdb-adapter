#!/usr/bin/env node

/*********************************************************************
 * Copyright (c) 2018 QNX Software Systems and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import { logger } from '@vscode/debugadapter/lib/logger';
import { GDBTargetDebugSession } from './desktop/GDBTargetDebugSession';
import { GDBDebugSessionLauncher } from './desktop/GDBDebugSessionLauncher';

process.on('uncaughtException', (err: any) => {
    logger.error(JSON.stringify(err));
});

class GDBTargetDebugSessionToRun extends GDBTargetDebugSession {
    constructor() {
        super();
    }
}

GDBDebugSessionLauncher.run(GDBTargetDebugSessionToRun);
