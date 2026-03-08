/**
 * BFT Map implementation (server side).
 *
 */
package dcb.dti;

import bftsmart.tom.MessageContext;
import bftsmart.tom.ServiceReplica;
import bftsmart.tom.server.defaultservices.DefaultSingleRecoverable;

import java.io.*;
import java.util.Map;
import java.util.TreeMap;

public class DTIServer extends DefaultSingleRecoverable {
    private TreeMap<Long, Coin> storedCoins;
    private long coinId;
    private long nftId;
    private TreeMap<Long, NFT> storedNFTs;

    //The constructor passes the id of the server to the super class
    public DTIServer(int id) {

        //turn-on BFT-SMaRt'replica
        new ServiceReplica(id, this, this);
        coinId = 0;
        nftId = 0;
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
                    TreeMap<Long, Coin> temp = new TreeMap<Long, Coin>();
                    for(Map.Entry<Long, Coin> entry : storedCoins.entrySet()) {
                        if(entry.getValue().owner == senderId){
                            temp.put(entry.getKey(), entry.getValue());
                        }
                    }
                    response.setCoins(temp);
                    break;
                case MY_NFTS:
                    TreeMap<Long, NFT> result = new TreeMap<>();
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().owner == senderId) {
                            result.put(entry.getKey(), entry.getValue());
                        }
                    }
                    response.setNFTs(result);
                    break;
                case MINT:
                    if(senderId != 4 ){
                        return new byte[0];
                    }
                    Coin coin = new Coin(++ coinId, senderId, request.getValue());
                    if(storedCoins.containsKey(coinId)){
                        return new byte[0];
                    }
                    storedCoins.put(coinId, coin);
                    response.setTokenId(coinId);
                    break;
                case BUY_NFT:
                    long[] coinsToSpend = request.getSpendingCoins();
                    long total = 0;
                    NFT nftToBuy = storedNFTs.get(request.getTokenId());
                    for(int i = 0; i != coinsToSpend.length; i++){
                        if(!storedCoins.containsKey(coinsToSpend[i]) || storedCoins.get(coinsToSpend[i]).owner != senderId){
                            return new byte[0];
                        }
                        total += storedCoins.get(coinsToSpend[i]).value;
                    }
                    if(total < nftToBuy.value){
                        return new byte[0];
                    }
                    for(int i = 0; i != coinsToSpend.length; i++){
                        storedCoins.remove(coinsToSpend[i]);
                    }
                    long remainder = total - nftToBuy.value;
                    if(remainder >= 0) {
                        nftToBuy.owner = senderId;
                        if(remainder == 0) {
                            response.setValue(0);
                        } else {
                            storedCoins.put(++ coinId, new Coin(coinId, senderId, remainder));
                            response.setValue(coinId);
                        }
                    } else {
                        response.setValue(-1);
                    }
                    break;
                case MINT_NFT:
                    NFT nft = new NFT(++nftId, senderId, request.getName(), request.getUri(), request.getValue());
                    if(storedNFTs.containsKey(nftId)){
                        return new byte[0];
                    }
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().name.equals(nft.name)) {
                            return new byte[0];
                        }
                    }
                    storedNFTs.put(nftId, nft);
                    response.setTokenId(nftId);
                    break;
                case SEARCH_NFT:
                    String text = request.getText();
                    TreeMap<Long, NFT> res = new TreeMap<>();
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().name.toLowerCase().contains(text.toLowerCase())) {
                            res.put(entry.getKey(), entry.getValue());
                        }
                    }
                    response.setNFTs(res);
                    break;
                case SET_NFT_PRICE:
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().name.equals(request.getName()) && entry.getValue().owner == senderId) {
                            entry.getValue().value = request.getValue();
                        }
                    }
                    break;
                case SPEND:
                    long[] spendingCoins =request.getSpendingCoins();
                    long sum = 0;
                    int receiver = request.getReceiverId();
                    long value = request.getValue();
                    for(int i = 0; i != spendingCoins.length; i++){
                        if(!storedCoins.containsKey(spendingCoins[i]) || storedCoins.get(spendingCoins[i]).owner != senderId){
                            return new byte[0];
                        }
                        sum += storedCoins.get(spendingCoins[i]).value;
                    }
                    if(sum < value){
                        return new byte[0];
                    }
                    for(int i = 0; i != spendingCoins.length; i++){
                        storedCoins.remove(spendingCoins[i]);
                    }
                    storedCoins.put(++ coinId, new Coin(coinId, receiver, value));
                    if(sum - value != 0){
                        storedCoins.put(++coinId, new Coin(coinId, senderId, sum - value));
                        response.setTokenId(coinId);
                    }
                    break;
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
                    TreeMap<Long, Coin> temp = new TreeMap<Long, Coin>();
                    for(Map.Entry<Long, Coin> entry : storedCoins.entrySet()) {
                        if(entry.getValue().owner == senderId){
                            temp.put(entry.getKey(), entry.getValue());
                        }
                    }
                    response.setCoins(temp);
                    break;
                case MY_NFTS:
                    TreeMap<Long, NFT> result = new TreeMap<>();
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().owner == senderId) {
                            result.put(entry.getKey(), entry.getValue());
                        }
                    }
                    response.setNFTs(result);
                case BUY_NFT:
                    long[] coinsToSpend = request.getSpendingCoins();
                    long total = 0;
                    NFT nftToBuy = storedNFTs.get(request.getTokenId());
                    for(int i = 0; i != coinsToSpend.length; i++){
                        if(!storedCoins.containsKey(coinsToSpend[i]) || storedCoins.get(coinsToSpend[i]).owner != senderId){
                            return new byte[0];
                        }
                        total += storedCoins.get(coinsToSpend[i]).value;
                    }
                    if(total < nftToBuy.value){
                        return new byte[0];
                    }
                    for(int i = 0; i != coinsToSpend.length; i++){
                        storedCoins.remove(coinsToSpend[i]);
                    }
                    long remainder = total - nftToBuy.value;
                    if(remainder >= 0) {
                        nftToBuy.owner = senderId;
                        if(remainder == 0) {
                            response.setValue(0);
                        } else {
                            storedCoins.put(++ coinId, new Coin(coinId, senderId, remainder));
                            response.setValue(coinId);
                        }
                    } else {
                        response.setValue(-1);
                    }
                    break;
                case MINT:
                    if(senderId != 4 ){
                        return new byte[0];
                    }
                    Coin coin = new Coin(++ coinId, senderId, request.getValue());
                    if(storedCoins.containsKey(coinId)){
                        return new byte[0];
                    }
                    storedCoins.put(coinId, coin);
                    response.setTokenId(coinId);
                    break;
                case MINT_NFT:
                    NFT nft = new NFT(++nftId, senderId, request.getName(), request.getUri(), request.getValue());
                    if(storedNFTs.containsKey(nftId)){
                        return new byte[0];
                    }
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().name.equals(nft.name)) {
                            return new byte[0];
                        }
                    }
                    storedNFTs.put(nftId, nft);
                    response.setTokenId(nftId);
                case SEARCH_NFT:
                    String text = request.getText();
                    TreeMap<Long, NFT> res = new TreeMap<>();
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().name.toLowerCase().contains(text.toLowerCase())) {
                            res.put(entry.getKey(), entry.getValue());
                        }
                    }
                    response.setNFTs(res);
                    break;
                case SET_NFT_PRICE:
                    for(Map.Entry<Long, NFT> entry : storedNFTs.entrySet()) {
                        if(entry.getValue().name.equals(request.getName()) && entry.getValue().owner == senderId) {
                            entry.getValue().value = request.getValue();
                        }
                    }
                    break;
                case SPEND:
                    long[] spendingCoins =request.getSpendingCoins();
                    long sum = 0;
                    int receiver = request.getReceiverId();
                    long value = request.getValue();
                    for(int i = 0; i != spendingCoins.length; i++){
                        if(!storedCoins.containsKey(spendingCoins[i]) || storedCoins.get(spendingCoins[i]).owner != senderId){
                            return new byte[0];
                        }
                        sum += storedCoins.get(spendingCoins[i]).value;
                    }
                    if(sum < value){
                        return new byte[0];
                    }
                    for(int i = 0; i != spendingCoins.length; i++){
                        storedCoins.remove(spendingCoins[i]);
                    }
                    storedCoins.put(++ coinId, new Coin(coinId, receiver, value));
                    if(sum - value != 0){
                        storedCoins.put(++coinId, new Coin(coinId, senderId, sum - value));
                        response.setTokenId(coinId);
                    }
                    break;
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
