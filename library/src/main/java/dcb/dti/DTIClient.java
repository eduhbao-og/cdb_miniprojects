/**
 * BFT Map implementation (interactive client).
 *
 */
package dcb.dti;

import java.io.Console;
import java.io.IOException;
import java.util.Map;
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
            String name = "";
            String uri = "";

            try (Scanner cmdScanner = new Scanner(console.readLine("\n  > "))) {
                if (cmdScanner.hasNext()) {
                    cmd = cmdScanner.next();
                }
                if (cmdScanner.hasNext()) {
                    name = cmdScanner.next();
                }                
                if (cmdScanner.hasNext()) {
                    uri = cmdScanner.next();
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
                System.out.println("\ncoins: ");
                for(Map.Entry<Long, Coin> entry : coins.entrySet()) {
                    System.out.println("\nid: " + entry.getKey() 
                                    + ", value: " + entry.getValue().value);
                }

            } else if(cmd.equalsIgnoreCase("MY_NFTS")){
                
                TreeMap<Long, NFT> nfts = dtiStub.MY_NFTS();
                System.out.println("\nnfts: ");
                for(Map.Entry<Long, NFT> entry : nfts.entrySet()) {
                    System.out.println("\nid: " + entry.getKey() 
                                    + ", name: " + entry.getValue().name 
                                    + ", URI: " + entry.getValue().uri);
                }

            } else if (cmd.equalsIgnoreCase("MINT_NFT") && value != -1 && !name.equals("") && !uri.equals("")) {
                
                long newNFTId = dtiStub.MINT_NFT(name, uri, value);
                System.out.println("\nnew coin minted with ID: " + newNFTId + "\n"); 
            
            } else if (cmd.equalsIgnoreCase("EXIT")) {

            } else {

                System.out.println("\tEXIT: Bye bye!\n");
                System.exit(0);

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
