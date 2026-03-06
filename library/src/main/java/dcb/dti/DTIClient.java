/**
 * BFT Map implementation (interactive client).
 *
 */
package dcb.dti;

import java.io.Console;
import java.io.IOException;
import java.util.Scanner;
import java.util.TreeMap;

public class DTIClient {

    public static void main(String[] args) throws IOException {
        int clientId = (args.length > 0) ? Integer.parseInt(args[0]) : 1001;
        DTIStub dtiStub = new DTIStub(clientId);
        Console console = System.console();

        System.out.println("\nCommands:\n");
        printCommands();

        while (true) {
            String cmd = "";
            long value = -1;

            try (Scanner cmdScanner = new Scanner(console.readLine("\n  > "))) {
                if (cmdScanner.hasNext()) {
                    cmd = cmdScanner.next();
                }
                if (cmdScanner.hasNext()) {
                    value = cmdScanner.nextLong();
                }
                //parse the remaining arguments (if any) 
            }
            
            if (cmd.equalsIgnoreCase("MINT") && value != -1) {

                long newCoinId = dtiStub.mint(value);
                System.out.println("\nnew coin minted with ID: " + newCoinId + "\n");

            } else if(cmd.equalsIgnoreCase("MY_COINS")){
                
                TreeMap<Long, Coin> coins = dtiStub.MY_COINS();
                System.out.println("\ncoins: " + coins + "\n");

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
        System.out.println("\tMINT <Value>: Mint new coins with the specified value");
        //...
        System.out.println("\tEXIT: Terminate this client\n");
    }

    
}
