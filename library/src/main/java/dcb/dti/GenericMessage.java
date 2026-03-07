package dcb.dti;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.TreeMap;

/**
 * A generic message class that can be used for various operations in a DTI application.
 * It includes a type to identify the operation and a value field for any associated data.
 * Additional fields can be added as needed for specific operations.
 */

public class GenericMessage implements Serializable {

    public enum Type {
        MY_COINS,MINT,SPEND,
        MY_NFTS,MINT_NFT,SET_NFT_PRICE,SEARCH_NFT,BUY_NFT
    };

    private Type type;
    private long value = 0;
    private long tokenId = -1;
    private TreeMap<Long, Coin> coins;
    private TreeMap<Long, NFT> nfts;
    private long[] spendingCoins;
    private int receiverId;
    private String name;
    private String uri;
    private NFT nft;

    //other possible data...
    
    public GenericMessage(Type type){
        this.type = type;
    }
    
    public static byte[] toBytes(GenericMessage message) throws IOException {
        ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
        ObjectOutputStream objOut = new ObjectOutputStream(byteOut);
        objOut.writeObject(message);
        
        objOut.flush();
        byteOut.flush();
        
        return byteOut.toByteArray();
    }
    
    public static GenericMessage fromBytes(byte[] rep) throws IOException, ClassNotFoundException {
        ByteArrayInputStream byteIn = new ByteArrayInputStream(rep);
        ObjectInputStream objIn = new ObjectInputStream(byteIn);
        return (GenericMessage) objIn.readObject();
    }
    
    public Type getType() {
        return type;
    }
    
    public void setType(Type type) {
        this.type = type;
    }
    
    public long getValue() {
        return value;
    }
    
    public void setValue(long value) {
        this.value = value;
    }
    
    public long getTokenId() {
        return tokenId;
    }
    
    public void setTokenId(long tokenId) {
        this.tokenId = tokenId;
    }
    
    public TreeMap<Long, Coin> getCoins() {
        return coins;
    }
    
    public void setCoins(TreeMap<Long, Coin> coins) {
        this.coins = coins;
    }
    
    public TreeMap<Long, NFT> getNFTs() {
        return nfts;
    }
    
    public void setNFTs(TreeMap<Long, NFT> nfts) {
        this.nfts = nfts;
    }
    
    public long[] getSpendingCoins() {
        return spendingCoins;
    }
    
    public void setSpendingCoins(long[] spendingCoins) {
        this.spendingCoins = spendingCoins;
    }
    
    public int getReceiverId() {
        return receiverId;
    }
    
    public void setReceiverId(int receiverId) {
        this.receiverId = receiverId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUri() {
        return uri;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }
    
    //more getters and setters for other possible data...
}
