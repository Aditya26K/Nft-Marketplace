"use client";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useChainId,
  useReadContract,
} from "wagmi";
import { useState, useEffect } from "react";
import { abi } from "./abi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

export default function Home() {
  const { address, isConnected,chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();
  

  const [nftUri, setNftUri] = useState("");
  const [burnTokenId, setBurnTokenId] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [buyTokenId, setBuyTokenId] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);

  const contractAddress = "0xf6d26b719aee4519456e793C3F4DF08f576C9bAf";

  const contractConfig = {
    address: contractAddress,
    abi: abi,
  };
  const { data, refetch,isError,isFetching,isFetched,error } =  useReadContract({
    abi,
    address: contractAddress,
    functionName: "getAllListings"
  
  });
console.log("data", data);
console.log("isError", isError);
console.log("isFetching", isFetching);
console.log("isFetched", isFetched);
  console.log("error", error);
  const getListings = async () => {
    try {
     refetch();
      setListings(data || []);
    } catch (error) {
      console.log("Failed to fetch listings: " + (error?.message || "Unknown error"));
    }
  };

  const safeMint = async () => {
    if (!nftUri.trim()) return alert("Enter a valid NFT URI");
    setLoading(true);
    try {
      await writeContract({
        ...contractConfig,
        functionName: "safeMint",
        args: [nftUri],
      });
      alert("NFT minted successfully!");
      setNftUri("");
    } catch (error) {
      alert("Failed to mint NFT: " + (error?.message || "Unknown error"));
    }
    setLoading(false);
  };

  const burnNFT = async () => {
    if (!burnTokenId) return alert("Enter NFT ID to burn");
    setLoading(true);
    try {
      await writeContract({
        ...contractConfig,
        functionName: "burn",
        args: [parseInt(burnTokenId)],
      });
      alert("NFT burned successfully!");
      setBurnTokenId("");
    } catch (error) {
      alert("Failed to burn NFT: " + (error?.message || "Unknown error"));
    }
    setLoading(false);
  };

  const transferNFT = async () => {
    if (!transferTokenId || !recipient) {
      alert("Enter both Token ID and Recipient Address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      alert("Invalid recipient address format");
      return;
    }

    setLoading(true);
    try {
      await writeContract({
        ...contractConfig,
        functionName: "safeTransferFrom",
        args: [address, recipient, parseInt(transferTokenId)],
      });
      alert("NFT transferred successfully!");
      setTransferTokenId("");
      setRecipient("");
    } catch (error) {
      alert("Failed to transfer NFT: " + (error?.message || "Unknown error"));
    }
    setLoading(false);
  };

  const buyNFT = async () => {
    if (!buyTokenId || !buyAmount) return alert("Enter NFT ID and amount to buy");
    setLoading(true);
    try {
      await writeContract({
        ...contractConfig,
        functionName: "buyNFT",
        args: [parseInt(buyTokenId)],
        value: BigInt(buyAmount),
      });
      alert("NFT purchased successfully!");
      setBuyTokenId("");
      setBuyAmount("");
    } catch (error) {
      alert("Failed to buy NFT: " + (error?.message || "Unknown error"));
    }
    setLoading(false);
  };

  const listNFT = async () => {
    if (!listTokenId || !listPrice) return alert("Enter valid token ID and price");
    setLoading(true);
    try {
      await writeContract({
        ...contractConfig,
        functionName: "listNFT",
        args: [parseInt(listTokenId), BigInt(listPrice)],
      });
      alert("NFT listed successfully!");
      setListTokenId("");
      setListPrice("");
    } catch (error) {
      alert("Failed to list NFT: " + (error?.message || "Unknown error"));
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white p-6">
      <Card className="w-full max-w-md p-6 shadow-xl bg-gray-800 rounded-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">NFT Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="flex flex-col space-y-3">
              {connectors.map((connector) => (
                <Button key={connector.id} onClick={() => connect({ connector })} className="bg-blue-500 hover:bg-blue-600">
                  Connect Wallet
                </Button>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">Connected: {address}</p>
              <Button onClick={() => disconnect()} className="w-full bg-red-500 hover:bg-red-600 my-3">
                Disconnect
              </Button>

              <Input placeholder="NFT Metadata URI" value={nftUri} onChange={(e) => setNftUri(e.target.value)} />
              <Button onClick={safeMint} disabled={loading} className="bg-green-500 w-full">Mint NFT</Button>

              <Input placeholder="Token ID to Burn" value={burnTokenId} onChange={(e) => setBurnTokenId(e.target.value)} />
              <Button onClick={burnNFT} disabled={loading} className="bg-red-500 w-full">Burn NFT</Button>

              <Input placeholder="Token ID to Transfer" value={transferTokenId} onChange={(e) => setTransferTokenId(e.target.value)} />
              <Input placeholder="Recipient Address" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              <Button onClick={transferNFT} disabled={loading} className="bg-yellow-500 w-full">Transfer NFT</Button>

              <Input placeholder="NFT ID to Buy" value={buyTokenId} onChange={(e) => setBuyTokenId(e.target.value)} />
              <Input placeholder="Amount (in Wei)" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
              <Button onClick={buyNFT} disabled={loading} className="bg-purple-500 w-full">Buy NFT</Button>

              <Input placeholder="Token ID to List" value={listTokenId} onChange={(e) => setListTokenId(e.target.value)} />
              <Input placeholder="Price (in Wei)" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
              <Button onClick={listNFT} disabled={loading} className="bg-blue-500 w-full">List NFT</Button>

              <Button onClick={getListings} className="bg-cyan-500 w-full">Get Listings</Button>

              {listings.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Listings:</h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {listings.map((listing, idx) => (
                      <li key={idx} className="bg-gray-700 p-3 rounded text-sm">
                        <p><strong>Seller:</strong> {listing.seller}</p>
                        <p><strong>Token ID:</strong> {Number(listing.tokenId)}</p>
                        <p><strong>Price:</strong> {BigInt(listing.price).toString()} Wei</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}