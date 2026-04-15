/**
 * BFT Map implementation (client side).
 *
 */
package dcb.bftmap;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.Set;

import bftsmart.tom.ServiceProxy;

public class BFTMapStub<K, V> implements Map<K, V> {
    private final ServiceProxy serviceProxy;

    public BFTMapStub(int id) {
        serviceProxy = new ServiceProxy(id);
    }

    /**
     *
     * @param key The key associated to the value
     * @return value The value previously added to the map
     */
    @Override
    public V get(Object key) {
        byte[] rep;
        try {
            BFTMapMessage<K,V> request = new BFTMapMessage<>();
            request.setType(BFTMapRequestType.GET);
            request.setKey(key);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeUnordered(BFTMapMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send GET request");
            return null;
        }

        if (rep.length == 0) {
            return null;
        }
        try {
            BFTMapMessage<K,V> response = BFTMapMessage.fromBytes(rep);
            return response.getValue();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of GET request "+ex);
            return null;
        }
    }

    /**
     *
     * @param key The key associated to the value
     * @param value Value to be added to the map
     */
    @Override
    public V put(K key, V value) {
        byte[] rep;
        try {
            BFTMapMessage<K,V> request = new BFTMapMessage<>();
            request.setType(BFTMapRequestType.PUT);
            request.setKey(key);
            request.setValue(value);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(BFTMapMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send PUT request");
            return null;
        }
        if (rep.length == 0) {
            return null;
        }

        try {
            BFTMapMessage<K,V> response = BFTMapMessage.fromBytes(rep);
            return response.getValue();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of PUT request "+ex);
            return null;
        }
    }

    @Override
    public int size() {
        byte[] rep;
        try {
            BFTMapMessage<K,V> request = new BFTMapMessage<>();
            request.setType(BFTMapRequestType.SIZE);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeUnordered(BFTMapMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send SIZE request");
            return -1;
        }

        if (rep.length == 0) {
            return -1;
        }
        try {
            BFTMapMessage<K,V> response = BFTMapMessage.fromBytes(rep);
            return response.getSize();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of SIZE request "+ex);
            return -1;
        }
    }

    @Override
    public V remove(Object key) {
        byte[] rep;
        try {
            BFTMapMessage<K,V> request = new BFTMapMessage<>();
            request.setType(BFTMapRequestType.REMOVE);
            request.setKey(key);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeOrdered(BFTMapMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send REMOVE request");
            return null;
        }
        if (rep.length == 0) {
            return null;
        }

        try {
            BFTMapMessage<K,V> response = BFTMapMessage.fromBytes(rep);
            return response.getValue();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of REMOVE request "+ex);
            return null;
        }
    }

    @Override
    public Set<K> keySet() {
        byte[] rep;
        try {
            BFTMapMessage<K,V> request = new BFTMapMessage<>();
            request.setType(BFTMapRequestType.KEYSET);

            //invokes BFT-SMaRt
            rep = serviceProxy.invokeUnordered(BFTMapMessage.toBytes(request));
        } catch (IOException e) {
            System.err.println("Failed to send KEYSET request");
            return null;
        }

        if (rep.length == 0) {
            return null;
        }
        try {
            BFTMapMessage<K,V> response = BFTMapMessage.fromBytes(rep);
            return response.getKeySet();
        } catch (ClassNotFoundException | IOException ex) {
            System.err.println("Failed to deserialized response of KEYSET request "+ex);
            return null;
        }
    }





    @Override
    public boolean containsKey(Object key) {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }

    @Override
    public boolean isEmpty() {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }

    @Override
    public void clear() {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }

    @Override
    public boolean containsValue(Object value) {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }

    @Override
    public void putAll(Map<? extends K, ? extends V> m) {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }

    @Override
    public Collection<V> values() {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }

    @Override
    public Set<Entry<K, V>> entrySet() {
        throw new UnsupportedOperationException("You are supposed to implement this method :)");
    }
}
