package dcb.dti;

public class Coin {
     /*ID: an integer (long) with the coin ID (no two coins can have the same id)
    o Owner: an integer (int) with the id of the client owning the coin
    o Value: a real number (long) with the value of the coin*/
    long id;
    int owner;
    long value;

    public Coin(long id, int owner, long value) {
        this.id = id;
        this.owner = owner;
        this.value = value;
    }
    
}
