/**
 * BFT Map implementation (server side).
 *
 */
package dcb.bftmap;

import bftsmart.tom.MessageContext;
import bftsmart.tom.ServiceReplica;
import bftsmart.tom.server.defaultservices.DefaultSingleRecoverable;

import java.io.*;
import java.util.TreeMap;

public class BFTMapServer<K, V> extends DefaultSingleRecoverable {
    private TreeMap<K, V> replicaMap;

    //The constructor passes the id of the server to the super class
    public BFTMapServer(int id) {
        replicaMap = new TreeMap<>();

        //turn-on BFT-SMaRt'replica
        new ServiceReplica(id, this, this);
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Use: java BFTMapServer <server id>");
            System.exit(-1);
        }
        new BFTMapServer<Integer, String>(Integer.parseInt(args[0]));
    }

    @Override
    public byte[] appExecuteOrdered(byte[] command, MessageContext msgCtx) {
        //all operations must be defined here to be invoked by BFT-SMaRt
        try {
            BFTMapMessage<K,V> response = new BFTMapMessage<>();
            BFTMapMessage<K,V> request = BFTMapMessage.fromBytes(command);
            BFTMapRequestType cmd = request.getType();

            System.out.println("Ordered execution of a "+cmd+" request from "+msgCtx.getSender());

            switch (cmd) {
                case PUT:
                    V oldValue = replicaMap.put(request.getKey(), request.getValue());

                    if (oldValue != null) {
                        response.setValue(oldValue);
                    }
                    return BFTMapMessage.toBytes(response);
                case GET:
                    V ret = replicaMap.get(request.getKey());

                    if (ret != null) {
                        response.setValue(ret);
                    }
                    return BFTMapMessage.toBytes(response);
                case SIZE:
                    int size = replicaMap.size();

                    response.setSize(size);
                    return BFTMapMessage.toBytes(response);
                case REMOVE:
                    V removed = replicaMap.remove(request.getKey());

                    if (removed != null) {
                        response.setValue(removed);
                    }
                    return BFTMapMessage.toBytes(response);
                case KEYSET:
                    response.setKeySet(replicaMap.keySet());
                    return BFTMapMessage.toBytes(response);
            }

            return null;
        }catch (IOException | ClassNotFoundException ex) {
            System.err.println("Failed to process ordered request "+ex);
            return new byte[0];
        }
    }

    @Override
    public byte[] appExecuteUnordered(byte[] command, MessageContext msgCtx) {
        //read-only operations can be defined here to be invoked without running consensus
        try {
            BFTMapMessage<K,V> response = new BFTMapMessage<>();
            BFTMapMessage<K,V> request = BFTMapMessage.fromBytes(command);
            BFTMapRequestType cmd = request.getType();

            System.out.println("Unordered execution of a "+cmd+" request from "+msgCtx.getSender());

            switch (cmd) {
                case GET:
                    V ret = replicaMap.get(request.getKey());

                    if (ret != null) {
                        response.setValue(ret);
                    }
                    return BFTMapMessage.toBytes(response);
                case SIZE:
                    int size = replicaMap.size();
                    
                    response.setSize(size);
                    return BFTMapMessage.toBytes(response);
                case KEYSET:
                    response.setKeySet(replicaMap.keySet());
                    return BFTMapMessage.toBytes(response);
                default:
                    System.err.println("Unknown command type: "+cmd);
                    return new byte[0];
            }
        } catch (IOException | ClassNotFoundException ex) {
            System.err.println("Failed to process unordered request "+ex);
            return new byte[0];
        }
    }

    @Override
    public byte[] getSnapshot() {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutput out = new ObjectOutputStream(bos)) {
            out.writeObject(replicaMap);
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
            replicaMap = (TreeMap<K, V>) in.readObject();
        } catch (ClassNotFoundException | IOException ex) {
            ex.printStackTrace(); //debug instruction
        }
    }

}
