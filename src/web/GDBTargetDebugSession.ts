/*********************************************************************
 * Copyright (c) 2019 Kichwa Coders and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

import { GDBTargetDebugSessionBase } from '../gdb/GDBTargetDebugSessionBase';
import { IGDBBackendFactory, IGDBServerFactory } from '../types/gdb';
import { GDBBackendFactory } from './factories/GDBBackendFactory';
import { GDBServerFactory } from './factories/GDBServerFactory';

export class GDBTargetDebugSession extends GDBTargetDebugSessionBase {
    constructor(
        backendFactory?: IGDBBackendFactory,
        gdbserverFactory?: IGDBServerFactory
    ) {
        super(
            backendFactory || new GDBBackendFactory(),
            gdbserverFactory || new GDBServerFactory()
        );
    }
}
