# Project 1

## Group 13

- Eduardo Sampaio, nº66097
- Gonçalo Vicente, nº66118

## Instructions

NOTE - a field is represented by "<[name of field]>". When creating the file, do not type either '<', '>' and the field name, just the value.

1. Build the project by running "./gradlew installDist" in the library/ directory
2. Run four servers in different terminals by typing "./smartrun.sh dcb.dti.DTIServer <[ServerID]>" in the library/build/install/library directory.
3. Run clients by typing "./smartrun.sh dcb.dti.DTIClient <[ClientID]>" in the library/build/install/library directory. The client IDs must be greater than the highest server ID.
4. The available commands will be printed on screen alongside their arguments and descriptions.

## Optimizations

- MY_COINS, MY_NFTS and SEARCH_NFT functions are invoked unordered.


