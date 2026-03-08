/**
 * BFT Map implementation (interactive client).
 *
 */
package dcb.dti;

import java.io.Console;
import java.io.IOException;
import java.util.ArrayList;
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
            int receiver = -1;
            ArrayList<Long> spendingCoins = new ArrayList<Long>();
            
            String name = "";
            String uri = "";

            try (Scanner cmdScanner = new Scanner(console.readLine("\n  > "))) {
                if (cmdScanner.hasNext()) {
                    cmd = cmdScanner.next();
                }
                if (cmdScanner.hasNextLong()) {
                    value = cmdScanner.nextLong();
                }
                if (cmdScanner.hasNextInt()) {
                    receiver = cmdScanner.nextInt();
                }
                while (cmdScanner.hasNextLong()) {
                    spendingCoins.add(cmdScanner.nextLong());
                }
                if (cmdScanner.hasNext()) {
                    name = cmdScanner.next();
                }                
                if (cmdScanner.hasNext()) {
                    uri = cmdScanner.next();
                }
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

            }else if(cmd.equalsIgnoreCase("SPEND") && value != -1){
                long change = dtiStub.SPEND(spendingCoins.stream().mapToLong(Long::longValue).toArray(), receiver, value);
                System.out.println("\nSpent coins and received change: " + change + "\n");

            } else if(cmd.equalsIgnoreCase("MY_NFTS")){
                
                TreeMap<Long, NFT> nfts = dtiStub.MY_NFTS();
                System.out.println("\nnfts: ");
                for(Map.Entry<Long, NFT> entry : nfts.entrySet()) {
                    System.out.println("\nid: " + entry.getKey() 
                                    + ", name: " + entry.getValue().name 
                                    + ", URI: " + entry.getValue().uri
                                    + ", value: " + entry.getValue().value);
                }

            } else if (cmd.equalsIgnoreCase("MINT_NFT") && value != -1 && !name.equals("") && !uri.equals("")) {
                
                long newNFTId = dtiStub.MINT_NFT(name, uri, value);
                System.out.println("\nnew NFT minted with ID: " + newNFTId + "\n"); 
            
            } else if (cmd.equalsIgnoreCase("SET_NFT_PRICE") && value != -1 && !name.equals("")) {
                
                dtiStub.SET_NFT_PRICE(name, value);
                System.out.println("\nNFT with name \"" + name + "\" set to value " + value + "\n"); 

            } else if (cmd.equalsIgnoreCase("SEARCH_NFT") && !name.equals("")) {
                
                TreeMap<Long, NFT> nfts = dtiStub.SEARCH_NFT(name);
                System.out.println("\nnfts: ");
                for(Map.Entry<Long, NFT> entry : nfts.entrySet()) {
                    System.out.println("\nid: " + entry.getKey() 
                                    + ", name: " + entry.getValue().name 
                                    + ", URI: " + entry.getValue().uri
                                    + ", value: " + entry.getValue().value);
                }

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
        System.out.println("\tMY_COINS: Shows your coins");
        System.out.println("\tSPEND <Value, Receiver, Coins>: Transfers amount to receiver if coins have sufficient funds");
        System.out.println("\tMY_NFTS: Shows your NFTs");
        System.out.println("\tMINT_NFT <Value, Name, URI>: Mint new NFTs with the specified parameters");
        System.out.println("\tSET_NFT_PRICE <Value, NFT>: Sets the specified NFT's value");
        System.out.println("\tSEARCH_NFT <Text>: Searches for NFT that contains the given text");
        System.out.println("\tBUY_NFT <NFT, Coins>: Uses coins to buy the specified NFT");
        System.out.println("\tEXIT: Terminate this client\n");
    }

    
}
