CALL cd C:\Users\a5138546\Workspace\Renesas2\cdt-gdb-adapter
CALL yarn format 
CALL yarn build
CALL cd C:\Users\a5138546\Workspace\Renesas2\renesas-gdb-adapter
CALL yarn add ../cdt-gdb-adapter
CALL yarn build
CALL cd C:\Users\a5138546\Workspace\Renesas2\renesas-gdb-vscode
CALL yarn add ../renesas-gdb-adapter
CALL yarn build
CALL cd C:\Users\a5138546\Workspace\Renesas2\cdt-gdb-adapter
