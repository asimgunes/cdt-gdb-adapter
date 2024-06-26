/*********************************************************************
 * Copyright (c) 2018 QNX Software Systems and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import {
    LaunchRequestArguments,
    AttachRequestArguments,
} from '../types/session';
import { GDBDebugSessionBase } from '../gdb/GDBDebugSessionBase';
import { GDBBackendFactory } from './factories/GDBBackendFactory';
import { IGDBBackendFactory } from '../types/gdb';
import { GDBDebugSessionLauncher } from './GDBDebugSessionLauncher';

export class GDBDebugSession extends GDBDebugSessionBase {
    constructor(backendFactory?: IGDBBackendFactory) {
        super(backendFactory || new GDBBackendFactory());
    }

    /**
     * Apply the initial and frozen launch/attach request arguments.
     * @param request the default request type to return if request type is not frozen
     * @param args the arguments from the user to apply initial and frozen arguments to.
     * @returns resolved request type and the resolved arguments
     */
    protected applyRequestArguments(
        request: 'launch' | 'attach',
        args: LaunchRequestArguments | AttachRequestArguments
    ): ['launch' | 'attach', LaunchRequestArguments | AttachRequestArguments] {
        return GDBDebugSessionLauncher.applyRequestArguments(request, args);
    }
}
