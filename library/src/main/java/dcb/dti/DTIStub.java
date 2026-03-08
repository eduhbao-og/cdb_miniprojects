/**
 * BFT Map implementation (client side).
 *
 */
package dcb.dti;

import java.io.IOException;
import java.util.TreeMap;

import bftsmart.tom.ServiceProxy;

public class DTIStub {
    private final ServiceProxy serviceProxy;

    public DTIStub(int id) {
        serviceProxy = new ServiceProxy(id);
    }

    public long mint(long value) {
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.MINT);
            request.setValue(value);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send MINT request");
            return -1;
        }

        if (rep.length == 0) {
            return -1;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getTokenId();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of MINT request "+ex);
            return -1;
        }
    }

    //MY_COINS(): get the IDs and values of the coins associated with this user.
    public TreeMap<Long, Coin> MY_COINS(){
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.MY_COINS);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send MY_COINS request");
            return null;
        }

        if (rep.length == 0) {
            return null;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getCoins();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of MY_COINS request "+ex);
            return null;
        }
    }

    //MY_NFTS(): list the ID, name, URI, and value of the NFTs the issuer possesses.
    public TreeMap<Long, NFT> MY_NFTS(){
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.MY_NFTS);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send MY_NFTS request");
            return null;
        }

        if (rep.length == 0) {
            return null;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getNFTs();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of MY_NFTS request "+ex);
            return null;
        }
    }

    public long SPEND(long[] coins, int receiver, long value){
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.SPEND);
            request.setSpendingCoins(coins);
            request.setReceiverId(receiver);
            request.setValue(value);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send SPEND request");
            return -1;
        }

        if (rep.length == 0) {
            return -1;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getTokenId();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of SPEND request "+ex);
            return -1;
        }
    }

    public long MINT_NFT(String name, String URI, long value) {
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.MINT_NFT);
            request.setName(name);
            request.setUri(URI);
            request.setValue(value);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send MINT_NFT request");
            return -1;
        }

        if (rep.length == 0) {
            return -1;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getTokenId();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of MINT_NFT request "+ex);
            return -1;
        }
    }

    public void SET_NFT_PRICE(String name, long value) {
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.SET_NFT_PRICE);
            request.setName(name);
            request.setValue(value);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send SET_NFT_PRICE request");
            return;
        }
        if (rep.length == 0) {
            return;
        }
    }

    public TreeMap<Long, NFT> SEARCH_NFT(String text){
        byte[] rep;
        try {
            GenericMessage request = new GenericMessage(GenericMessage.Type.SEARCH_NFT);
            request.setText(text);
            
            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send SEARCH_NFT request");
            return null;
        }

        if (rep.length == 0) {
            return null;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getNFTs();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of SEARCH_NFT request "+ex);
            return null;
        }
    }

     public long BUY_NFT(long value, long[] coins) {
         byte[] rep;
         try {
             GenericMessage request = new GenericMessage(GenericMessage.Type.BUY_NFT);
             request.setTokenId(value);
             request.setSpendingCoins(coins);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(GenericMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send BUY_NFT request");
            return -1;
        }
        if (rep.length == 0) {
            return -1;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getValue();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of BUY_NFT request "+ex);
            return -1;
        }
    }
}
