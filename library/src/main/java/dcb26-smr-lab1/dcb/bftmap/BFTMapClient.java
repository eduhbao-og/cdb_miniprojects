/**
 * BFT Map implementation (interactive client).
 *
 */
package dcb.bftmap;

import java.io.Console;
import java.io.IOException;
import java.util.Scanner;

public class BFTMapClient {

    public static void main(String[] args) throws IOException {
        int clientId = (args.length > 0) ? Integer.parseInt(args[0]) : 1001;
        BFTMapStub<Integer, String> bftMap = new BFTMapStub<Integer, String>(clientId);
        Console console = System.console();

        System.out.println("\nCommands:\n");
        printCommands();

        while (true) {
            String cmd = "";
            int key = -1; 
            String value = null;

            try (Scanner cmdScanner = new Scanner(console.readLine("\n  > "))) {
                if (cmdScanner.hasNext()) {
                    cmd = cmdScanner.next();
                }
                if (cmdScanner.hasNextInt()) {
                    key = cmdScanner.nextInt();
                }
                if (cmdScanner.hasNext()) {
                    value = cmdScanner.next();
                }
            }
            
            if (cmd.equalsIgnoreCase("PUT") && key != -1 && value != null) {

                //invokes the op on the servers
                bftMap.put(key, value);
                System.out.println("\nkey-value pair added to the map\n");

            } else if (cmd.equalsIgnoreCase("GET") && key != -1) {

                //invokes the op on the servers
                value = bftMap.get(key);
                System.out.println("\nValue associated with " + key + ": " + value + "\n");

            } else if (cmd.equalsIgnoreCase("KEYSET")) {

                System.out.println("\tKeyset: " + bftMap.keySet() + "\n");

            } else if (cmd.equalsIgnoreCase("REMOVE") && key != -1) {

                value = bftMap.remove(key);
                System.out.println("\tRemoved key: " + key + " value: " + value + "\n");

            } else if (cmd.equalsIgnoreCase("SIZE")) {

                //invokes the op on the servers
                int size = bftMap.size();
                System.out.println("\nSize of the map is " + size + "\n");

            } else if (cmd.equalsIgnoreCase("EXIT")) {

                System.out.println("\tEXIT: Bye bye!\n");
                System.exit(0);

            } else {
                System.out.println("\tInvalid command. Here's the available commands:P\n");
                printCommands();
            }
        }
    }

    private static void printCommands() {
        System.out.println("\tPUT <Number> <String>: Insert value into the map");
        System.out.println("\tGET <Number>: Retrieve value from the map");
        System.out.println("\tSIZE: Retrieve the number of pairs in the map");
        System.out.println("\tREMOVE <Number>: Removes the value associated with the supplied key");
        System.out.println("\tKEYSET: List all keys available in the table");
        System.out.println("\tEXIT: Terminate this client\n");
    }

    
}
