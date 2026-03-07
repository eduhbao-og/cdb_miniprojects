/**
 * BFT Map implementation (server side).
 *
 */
package dcb.dti;

import bftsmart.tom.MessageContext;
import bftsmart.tom.ServiceReplica;
import bftsmart.tom.server.defaultservices.DefaultSingleRecoverable;

import java.io.*;
import java.util.TreeMap;

public class DTIServer extends DefaultSingleRecoverable {
    private TreeMap<Long, Coin> storedCoins;
    private long coinId;
    private TreeMap<Long, NFT> storedNFTs;

    //The constructor passes the id of the server to the super class
    public DTIServer(int id) {

        //turn-on BFT-SMaRt'replica
        new ServiceReplica(id, this, this);
        coinId = 0;
        storedCoins = new TreeMap<Long, Coin>();
        storedNFTs = new TreeMap<Long, NFT>();
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Use: java DTIServer <server id>");
            System.exit(-1);
        }
        new DTIServer(Integer.parseInt(args[0]));
    }

    @Override
    public byte[] appExecuteOrdered(byte[] command, MessageContext msgCtx) {
        //all operations must be defined here to be invoked by BFT-SMaRt
        try {
            GenericMessage request = GenericMessage.fromBytes(command);
            GenericMessage.Type cmd = request.getType();
            GenericMessage response = new GenericMessage(cmd);

            int senderId = msgCtx.getSender();

            System.out.println("Ordered execution of a "+cmd+" request from "+senderId);

            switch (cmd) {
                case MY_COINS:
                    //process MYCOINS request and fill the response...
                case MY_NFTS:
                    response.setNFTs(storedNFTs);
                case MINT:
                    //process MINT request and fill the response...
                case BUY_NFT:
                    //process BUY_NFT request and fill the response...
                case MINT_NFT:
                    //process MINT_NFT request and fill the response...
                case SEARCH_NFT:
                    //process SEARCH_NFT request and fill the response...
                case SET_NFT_PRICE:
                    //process SET_NFT_PRICE request and fill the response...
                case SPEND:
                    //process SPEND request and fill the response...
                default:
                    break;
            }

            return GenericMessage.toBytes(response);
        }catch (IOException | ClassNotFoundException ex) {
            System.err.println("Failed to process ordered request "+ex);
            return new byte[0];
        }
    }

    @Override
    public byte[] appExecuteUnordered(byte[] command, MessageContext msgCtx) {
        //read-only operations can be defined here to be invoked by BFT-SMaRt
        try {
            GenericMessage request = GenericMessage.fromBytes(command);
            GenericMessage.Type cmd = request.getType();
            GenericMessage response = new GenericMessage(cmd);

            int senderId = msgCtx.getSender();

            System.out.println("Unordered execution of a "+cmd+" request from "+senderId);

            switch (cmd) {
                case MY_COINS:
                    //process MY_COINS request and fill the response...
                case MY_NFTS:
                    response.setNFTs(storedNFTs);
                //deal with other cases...
                case BUY_NFT:
                    //process BUY_NFT request and fill the response...
                case MINT:
                    //process MINT request and fill the response...
                case MINT_NFT:
                    //process MINT_NFT request and fill the response...
                case SEARCH_NFT:
                    //process SEARCH_NFT request and fill the response...
                case SET_NFT_PRICE:
                    //process SET_NFT_PRICE request and fill the response...
                case SPEND:
                    //process SPEND request and fill the response...
                default:
                    break;
            }

            return GenericMessage.toBytes(response);
        }catch (IOException | ClassNotFoundException ex) {
            System.err.println("Failed to process unordered request "+ex);
            return new byte[0];
        }
    }

    @Override
    public byte[] getSnapshot() {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutput out = new ObjectOutputStream(bos)) {
            out.writeObject(coinId);
            out.writeObject(storedCoins);
            out.writeObject(storedNFTs);
            out.flush();
            bos.flush();
            return bos.toByteArray();
        } catch (IOException ex) {
            ex.printStackTrace(); //debug instruction
            return new byte[0];
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public void installSnapshot(byte[] state) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(state);
             ObjectInput in = new ObjectInputStream(bis)) {
            coinId = (long) in.readObject();
            storedCoins = (TreeMap<Long, Coin>) in.readObject();
            storedNFTs = (TreeMap<Long, NFT>) in.readObject();
        } catch (ClassNotFoundException | IOException ex) {
            ex.printStackTrace(); //debug instruction
        }
    }

}
