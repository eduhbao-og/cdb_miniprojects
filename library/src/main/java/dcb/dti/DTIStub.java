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
            System.err.println("Failed to send MINT request");
            return null;
        }

        if (rep.length == 0) {
            return null;
        }
        try {
            GenericMessage response = GenericMessage.fromBytes(rep);
            return response.getCoins();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of MINT request "+ex);
            return null;
        }
    }

    //add other methods to invoke the other operations (MY_COINS, MY_NFTS, MINT_NFT, SET_NFT_PRICE, SEARCH_NFT, BUY_NFT)...
}
