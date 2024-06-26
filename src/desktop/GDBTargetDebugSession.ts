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
import { OutputEvent } from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';
import { SerialPort, ReadlineParser } from 'serialport';
import { Socket } from 'net';
import {
    TargetLaunchRequestArguments,
    TargetAttachRequestArguments,
    UARTArguments,
} from '../types/session';
import { IGDBBackendFactory, IGDBServerFactory } from '../types/gdb';
import { GDBBackendFactory } from './factories/GDBBackendFactory';
import { GDBServerFactory } from './factories/GDBServerFactory';
import { EOL } from 'os';
import { GDBDebugSessionLauncher } from './GDBDebugSessionLauncher';

export class GDBTargetDebugSession extends GDBTargetDebugSessionBase {
    // Serial Port to capture UART output across the serial line
    protected serialPort?: SerialPort;
    // Socket to listen on a TCP port to capture UART output
    protected socket?: Socket;

    constructor(
        backendFactory?: IGDBBackendFactory,
        gdbserverFactory?: IGDBServerFactory
    ) {
        super(
            backendFactory || new GDBBackendFactory(),
            gdbserverFactory || new GDBServerFactory()
        );
    }

    protected applyRequestArguments(
        request: 'launch' | 'attach',
        args: TargetLaunchRequestArguments | TargetAttachRequestArguments
    ): [
        'launch' | 'attach',
        TargetLaunchRequestArguments | TargetAttachRequestArguments
    ] {
        return GDBDebugSessionLauncher.applyRequestArguments(request, args);
    }

    protected override async setupCommonLoggerAndBackends(
        args: TargetLaunchRequestArguments | TargetAttachRequestArguments
    ) {
        super.setupCommonLoggerAndBackends(args);

        this.gdbserverProcessManager =
            await this.gdbserverFactory?.createGDBServerManager(args);
    }

    protected initializeUARTConnection(
        uart: UARTArguments,
        host: string | undefined
    ): void {
        if (uart.serialPort !== undefined) {
            // Set the path to the serial port
            this.serialPort = new SerialPort({
                path: uart.serialPort,
                // If the serial port path is defined, then so will the baud rate.
                baudRate: uart.baudRate ?? 115200,
                // If the serial port path is deifned, then so will the number of data bits.
                dataBits: uart.characterSize ?? 8,
                // If the serial port path is defined, then so will the number of stop bits.
                stopBits: uart.stopBits ?? 1,
                // If the serial port path is defined, then so will the parity check type.
                parity: uart.parity ?? 'none',
                // If the serial port path is defined, then so will the type of handshaking method.
                rtscts: uart.handshakingMethod === 'RTS/CTS' ? true : false,
                xon: uart.handshakingMethod === 'XON/XOFF' ? true : false,
                xoff: uart.handshakingMethod === 'XON/XOFF' ? true : false,
                autoOpen: false,
            });

            this.serialPort.on('open', () => {
                this.sendEvent(
                    new OutputEvent(
                        `listening on serial port ${this.serialPort?.path}${EOL}`,
                        'Serial Port'
                    )
                );
            });

            const SerialUartParser = new ReadlineParser({
                delimiter: uart.eolCharacter === 'CRLF' ? '\r\n' : '\n',
                encoding: 'utf8',
            });

            this.serialPort
                .pipe(SerialUartParser)
                .on('data', (line: string) => {
                    this.sendEvent(new OutputEvent(line + EOL, 'Serial Port'));
                });

            this.serialPort.on('close', () => {
                this.sendEvent(
                    new OutputEvent(
                        `closing serial port connection${EOL}`,
                        'Serial Port'
                    )
                );
            });

            this.serialPort.on('error', (err) => {
                this.sendEvent(
                    new OutputEvent(
                        `error on serial port connection${EOL} - ${err}`,
                        'Serial Port'
                    )
                );
            });

            this.serialPort.open();
        } else if (uart.socketPort !== undefined) {
            this.socket = new Socket();
            this.socket.setEncoding('utf-8');

            let tcpUartData = '';
            this.socket.on('data', (data: string) => {
                for (const char of data) {
                    if (char === '\n') {
                        this.sendEvent(
                            new OutputEvent(tcpUartData + '\n', 'Socket')
                        );
                        tcpUartData = '';
                    } else {
                        tcpUartData += char;
                    }
                }
            });
            this.socket.on('close', () => {
                this.sendEvent(new OutputEvent(tcpUartData + EOL, 'Socket'));
                this.sendEvent(
                    new OutputEvent(`closing socket connection${EOL}`, 'Socket')
                );
            });
            this.socket.on('error', (err) => {
                this.sendEvent(
                    new OutputEvent(
                        `error on socket connection${EOL} - ${err}`,
                        'Socket'
                    )
                );
            });
            this.socket.connect(
                // Putting a + (unary plus operator) infront of the string converts it to a number.
                +uart.socketPort,
                // Default to localhost if target.host is undefined.
                host ?? 'localhost',
                () => {
                    this.sendEvent(
                        new OutputEvent(
                            `listening on tcp port ${uart?.socketPort}${EOL}`,
                            'Socket'
                        )
                    );
                }
            );
        }
    }

    protected async afterInitCommands(
        response: DebugProtocol.AttachResponse | DebugProtocol.LaunchResponse,
        args: TargetAttachRequestArguments
    ): Promise<void> {
        if (args.target?.uart !== undefined) {
            this.initializeUARTConnection(args.target.uart, args.target.host);
        }
    }

    protected async stopGDBServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.gdbserver || this.gdbserver.exitCode !== null) {
                resolve();
            } else {
                this.gdbserver.on('exit', () => {
                    resolve();
                });
                this.gdbserver?.kill();
            }
            setTimeout(() => {
                reject();
            }, 1000);
        });
    }

    protected async disconnectRequest(
        response: DebugProtocol.DisconnectResponse,
        args: DebugProtocol.DisconnectArguments
    ): Promise<void> {
        try {
            if (this.serialPort !== undefined && this.serialPort.isOpen)
                this.serialPort.close();
            super.disconnectRequest(response, args);
        } catch (err) {
            this.sendErrorResponse(
                response,
                1,
                err instanceof Error ? err.message : String(err)
            );
        }
    }
}
