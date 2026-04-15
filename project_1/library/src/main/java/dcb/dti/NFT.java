package dcb.dti;

import java.io.Serializable;

public class NFT implements Serializable{
    /*ID: an integer (long) with the NFT id (no two NFTs can have the same id)
    o Owner: an integer (int) with the id of the client owning the NFT
    o Name: the name (a String) of the NFT
    o URI: the URI (a String, typically a URL) of the NFT
    o Value: a real number (long) with the value of the NFT*/
    long id;
    int owner;
    String name;
    String uri;
    long value;

    public NFT(long id, int owner, String name, String uri, long value) {
        this.id = id;
        this.owner = owner;
        this.name = name;
        this.uri = uri;
        this.value = value;
    }
}
