"use client"
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from "wagmi"
import { ConnectKitButton } from "connectkit"
import { createPublicClient, http } from "viem"
import { baseSepolia } from "viem/chains"
import { useState, useEffect } from "react"
import { abi } from "./abi"
import { ArrowLeftRight, Wallet, Plus, ScrollText, Gem, BadgePercent } from "lucide-react"
import { ethers } from "ethers"
export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync, writeContract } = useWriteContract()

  // State variables
  const [nftUri, setNftUri] = useState("")
  const [burnTokenId, setBurnTokenId] = useState("")
  const [transferTokenId, setTransferTokenId] = useState("")
  const [recipient, setRecipient] = useState("")
  const [listTokenId, setListTokenId] = useState("")
  const [listPrice, setListPrice] = useState("")
  const [allowBargain, setAllowBargain] = useState(false)
  const [buyTokenId, setBuyTokenId] = useState("")
  const [bargainTokenId, setBargainTokenId] = useState("")
  const [bargainId, setBargainId] = useState()
  const [offerAmount, setOfferAmount] = useState("")
  const [selectedOfferId, setSelectedOfferId] = useState("")
  const [loading, setLoading] = useState(false)
  const [listings, setListings] = useState([])
  const [bargainOffers, setBargainOffers] = useState([])
  const [acceptedOffers, setAcceptedOffers] = useState([])
  const [offerID, setOfferId] = useState("")
  const [buyPrice, setBuyPrice] = useState("")
  const [tokenId, setTokenId] = useState("");
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  })
  const contractAddress = "0x1A63FDc62Dd286178B31Bd587da584183F3BbaFf"

  const contractConfig = {
    address: contractAddress,
    abi: abi,
  }

  // Read contract hooks
  const { data: listingsData, refetch: refetchListings } = useReadContract({
    abi,
    address: contractAddress,
    functionName: "getAllListings",
  })
  const { data: bargainIdData, refetch: refetchBargainId, isFetching, error: bargainError } = useReadContract({
    abi: abi,
    address: contractAddress,
    functionName: "getBargainId",
    args: [tokenId, address],
  });

  const { data: offersData, refetch: refetchOffers } = useReadContract({
    abi,
    address: contractAddress,
    functionName: "getBargainOffers",
    args: bargainId ? [bargainId] : undefined,
    account: address,
    enabled: true,
  })

  // Effect hooks
  useEffect(() => {
    if (listingsData) setListings(listingsData)
  }, [listingsData])

  useEffect(() => {
    if (offersData) {
      setBargainOffers(offersData)
      findAcceptedOffer()
    }
  }, [offersData])

  const safeMint = async () => {
    if (!nftUri.trim()) return alert("Enter a valid NFT URI")
    setLoading(true)
    try {
      await writeContract({
        ...contractConfig,
        functionName: "safeMint",
        args: [nftUri],
      })
      alert("NFT minted!")
      setNftUri("")
      refetchListings()
    } catch (error) {
      alert("Mint failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const burnNFT = async () => {
    if (!burnTokenId) return alert("Enter NFT ID to burn")
    setLoading(true)
    try {
      await writeContract({
        ...contractConfig,
        functionName: "burn",
        args: [Number.parseInt(burnTokenId)],
      })
      alert("NFT burned!")
      setBurnTokenId("")
      refetchListings()
    } catch (error) {
      alert("Burn failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const transferNFT = async () => {
    if (!transferTokenId || !recipient) return alert("Missing fields")
    setLoading(true)
    try {
      await writeContract({
        ...contractConfig,
        functionName: "safeTransferFrom",
        args: [address, recipient, Number.parseInt(transferTokenId)],
      })
      alert("Transfer successful!")
      setTransferTokenId("")
      setRecipient("")
      refetchListings()
    } catch (error) {
      alert("Transfer failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const listNFT = async () => {
    if (!listTokenId || !listPrice) return alert("Missing fields")
    setLoading(true)
    try {
      await writeContract({
        ...contractConfig,
        functionName: "listNFT",
        args: [Number.parseInt(listTokenId), BigInt(listPrice), allowBargain],
      })
      alert("NFT listed!")
      setListTokenId("")
      setListPrice("")
      refetchListings()
    } catch (error) {
      alert("Listing failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const buyNFT = async (tokenId, price) => {
    setLoading(true)
    console.log(tokenId, price)
    if (!tokenId || !price) return alert("Missing fields")
    try {
      await writeContractAsync({
        ...contractConfig,
        functionName: "buyNFT",
        args: [Number.parseInt(tokenId)],
        value: price,
      })
      alert("Purchase successful!")
      setBuyTokenId("")
      refetchListings()
    } catch (error) {
    }
    setLoading(false)
  }

  const startBargain = async () => {
    if (!bargainTokenId) return alert("Enter NFT ID")
    setLoading(true)
    try {
      await writeContractAsync({
        ...contractConfig,
        functionName: "startBargain",
        args: [Number.parseInt(bargainTokenId)],
      })
      alert("Bargain started!")

      refetchOffers()
    } catch (error) {
      alert("Bargain failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const makeBuyerOffer = async () => {
    if (!bargainId || !offerAmount) return alert("Missing fields")
    setLoading(true)
    console.log("bargainId is ", bargainId)
    const id = bargainId
    console.log("type of id is ", typeof id)
    try {
      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: "makeBuyerOffer",
        args: [bargainId, BigInt(offerAmount)],
      })
      console.log("Transaction hash:", hash)
      alert("Offer submitted!")
      setOfferAmount("")
      refetchOffers()
    } catch (error) {
      alert("Offer failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const makeCounterOffer = async () => {
    if (!bargainId || !offerAmount) return alert("Missing fields")
    setLoading(true)
    try {
      const riteContractAsync = writeContractAsync
      const hash = await riteContractAsync({
        ...contractConfig,
        functionName: "makeCounterOffer",
        args: [bargainId, BigInt(offerAmount)],
      })
      alert("Counter offer submitted!")
      setOfferAmount("")
      refetchOffers()
    } catch (error) {
      alert("Counter offer failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const acceptOffer = async () => {
    if (!bargainId || selectedOfferId === "") return alert("Select offer")
    setLoading(true)
    try {
      await writeContract({
        ...contractConfig,
        functionName: "acceptOffer",
        args: [bargainId, Number.parseInt(selectedOfferId)],
      })
      alert("Offer accepted!")
      setSelectedOfferId("")
      refetchOffers()
    } catch (error) {
      alert("Acceptance failed: " + error?.shortMessage)
    }
    setLoading(false)
  }

  const checkOfferAcceptance = async (offerId) => {
    try {
      const result = await client.readContract({
        abi,
        address: contractAddress,
        functionName: "isOfferAcceptedByBoth",
        args: [bargainId, offerId],
        account: address,
      })
      return result
    } catch (error) {
      console.error("Error checking offer acceptance:", error)
      return false
    }
  }

  const handleAcceptOffer = async (offerId) => {
    setSelectedOfferId(offerId.toString())
    try {
      await acceptOffer()
      const isAccepted = await checkOfferAcceptance(offerId)
      if (isAccepted) {
        alert("Offer accepted by both parties!")
      } else {
        alert("Your acceptance has been recorded")
      }
    } catch (error) {
      console.error("Error accepting offer:", error)
    }
  }
  // const { data: acceptedData, refetch: refetchAcceptedData, error: acceptError } = useReadContract({
  //   abi,
  //   address: contractAddress,
  //   functionName: "isOfferAcceptedByBoth",
  //   args: [bargainId, offerID],
  //   account: address,
  // });

  const findAcceptedOffer = async () => {
    if (!bargainId) return alert("Select a bargain ID")
    console.log("Finding accepted offers for bargain ID:", bargainId)
    console.log("Current number of offers", offersData.length)
    try {
      const acceptedOffersTemp = []
      if (offersData) {
        for (let i = 0; i < offersData.length; i++) {
          const result = await client.readContract({
            abi: abi,
            address: contractAddress,
            functionName: "isOfferAcceptedByBoth",
            args: [bargainId, i],
            account: address,
          })
          acceptedOffersTemp.push(result)
        }
      }
      setAcceptedOffers(acceptedOffersTemp)
      console.log("Accepted offers:", acceptedOffersTemp)
    } catch (error) {
      console.error("Error fetching accepted offers:", error)
    }
  }

  // Replace the entire return statement with this enhanced UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Gem className="h-10 w-10 text-purple-400" />
              <div className="absolute -inset-1 rounded-full bg-purple-500/20 blur-sm -z-10"></div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              NFT Marketplace
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* {isConnected ? (
              <>
                <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/50 shadow-lg">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium">{address.slice(0, 6)}...{address.slice(-4)}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-500/20 hover:bg-red-600/30 text-red-400 rounded-full px-6 py-2 border border-red-700/30 shadow-lg transition-all duration-300"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                className="bg-blue-500/20 hover:bg-blue-600/30 text-blue-400 rounded-full px-6 py-2 flex gap-2 items-center border border-blue-700/30 shadow-lg transition-all duration-300"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            )} */}
            <ConnectKitButton />
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - NFT Management */}
          <div className="space-y-6">
            {/* Mint & Burn Card */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-xl hover:shadow-blue-900/20 transition-all duration-300">
              <div className="pb-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <Plus className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-lg font-medium">Create & Manage NFTs</span>
                </div>
              </div>
              <div className="pt-6 space-y-6 p-6">
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">Mint New NFT</label>
                  <input
                    type="text"
                    placeholder="IPFS URI (e.g.: ipfs://Qm...)"
                    value={nftUri}
                    onChange={(e) => setNftUri(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all duration-300 text-white"
                  />
                  <button
                    onClick={safeMint}
                    className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border border-green-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                  >
                    Mint NFT
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">Burn NFT</label>
                  <input
                    type="text"
                    placeholder="Enter Token ID"
                    value={burnTokenId}
                    onChange={(e) => setBurnTokenId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all duration-300 text-white"
                  />
                  <button
                    onClick={burnNFT}
                    className="w-full bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 text-red-400 border border-red-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                  >
                    Burn NFT
                  </button>
                </div>
              </div>
            </div>

            {/* Transfer & List Card */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-xl hover:shadow-purple-900/20 transition-all duration-300">
              <div className="pb-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-lg font-medium">Transfer & List</span>
                </div>
              </div>
              <div className="pt-6 space-y-6 p-6">
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">Transfer NFT</label>
                  <input
                    type="text"
                    placeholder="Token ID"
                    value={transferTokenId}
                    onChange={(e) => setTransferTokenId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Recipient Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 text-white"
                  />
                  <button
                    onClick={transferNFT}
                    className="w-full bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 text-blue-400 border border-blue-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                  >
                    Transfer
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">List NFT</label>
                  <input
                    type="text"
                    placeholder="Token ID"
                    value={listTokenId}
                    onChange={(e) => setListTokenId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all duration-300 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Price (ETH)"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all duration-300 text-white"
                  />
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="bargain-checkbox"
                        checked={allowBargain}
                        onChange={(e) => setAllowBargain(e.target.checked)}
                        className="w-4 h-4 accent-purple-500 cursor-pointer"
                      />
                      <div className={`absolute w-9 h-5 rounded-full transition-colors duration-300 ${allowBargain ? 'bg-purple-500/30' : 'bg-gray-700'} -z-10`}></div>
                    </div>
                    <label htmlFor="bargain-checkbox" className="text-sm text-gray-300 cursor-pointer">Enable Bargaining</label>
                  </div>
                  <button
                    onClick={listNFT}
                    className="w-full bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 text-purple-400 border border-purple-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                  >
                    List for Sale
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Marketplace & Bargaining */}
          <div className="space-y-6">
            {/* Marketplace Listings */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-xl hover:shadow-yellow-900/20 transition-all duration-300">
              <div className="pb-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-yellow-500/10">
                    <ScrollText className="h-5 w-5 text-yellow-400" />
                  </div>
                  <span className="text-lg font-medium">Marketplace Listings</span>
                </div>
              </div>
              <div className="pt-6 p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">{listings.length}</span>
                      <label className="text-sm text-gray-300">Active Listings</label>
                    </div>
                    <button
                      onClick={refetchListings}
                      className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/30 shadow-sm transition-all duration-300 flex items-center gap-1 px-3 py-1 rounded-md text-sm"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 8V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                  {listings.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900/30">
                      {listings.map((listing, idx) => (
                        <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 hover:border-gray-700/50 transition-all duration-300 shadow-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-gray-300 text-xs font-medium">#{listing.tokenId}</span>
                                Token
                              </h3>
                              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                <span className="text-yellow-400 font-medium">{listing.price}</span> ETH
                              </p>
                            </div>
                            <button
                              onClick={() => buyNFT(listing.tokenId, listing.price)}
                              className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border border-green-700/30 shadow-md transition-all duration-300 px-3 py-1 rounded-md text-sm"
                            >
                              Buy Now
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Wallet className="h-3 w-3 text-gray-500" />
                              {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                            </span>
                            {listing.allowBargain && (
                              <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs font-medium border border-purple-700/30">
                                Bargaining Enabled
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                      <ScrollText className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No active listings found</p>
                      <p className="text-gray-500 text-sm mt-1">Mint and list your first NFT</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bargaining Section */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-xl hover:shadow-pink-900/20 transition-all duration-300">
              <div className="pb-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-pink-500/10">
                    <BadgePercent className="h-5 w-5 text-pink-400" />
                  </div>
                  <span className="text-lg font-medium">Bargaining Hub</span>
                </div>
              </div>
              <div className="pt-6 space-y-6 p-6">
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">Get Bargain ID</label>
                  <input
                    type="text"
                    placeholder="Token ID"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all duration-300 text-white"
                  />
                  <button
                    onClick={refetchBargainId}
                    className="w-full bg-gradient-to-r from-pink-600/20 to-pink-700/20 hover:from-pink-600/30 hover:to-pink-700/30 text-pink-400 border border-pink-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                  >
                    Get Bargain ID
                  </button>
                  {bargainIdData && <p className="text-sm text-gray-300">Bargain ID: <span className="font-medium">{bargainIdData}</span></p>}
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">Start Bargaining</label>
                  <input
                    type="text"
                    placeholder="Enter NFT Token ID"
                    value={bargainTokenId}
                    onChange={(e) => setBargainTokenId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all duration-300 text-white"
                  />
                  <button
                    onClick={startBargain}
                    className="w-full bg-gradient-to-r from-pink-600/20 to-pink-700/20 hover:from-pink-600/30 hover:to-pink-700/30 text-pink-400 border border-pink-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                  >
                    Initiate Bargain
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-gray-300 font-medium">Make Offer</label>
                  <input
                    type="text"
                    placeholder="Bargain Session ID"
                    value={bargainId}
                    onChange={(e) => setBargainId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Offer Amount (ETH)"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-gray-900/70 border border-gray-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 text-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={makeBuyerOffer}
                      className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30 text-blue-400 border border-blue-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                    >
                      Buyer Offer
                    </button>
                    <button
                      onClick={makeCounterOffer}
                      className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 text-purple-400 border border-purple-700/30 shadow-md transition-all duration-300 py-2 rounded-md"
                    >
                      Counter Offer
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-300 font-medium">Active Offers</label>
                    <button
                      onClick={() => setBargainOffers(bargainOffers)}
                      className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/30 shadow-sm transition-all duration-300 px-3 py-1 rounded-md text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                  {bargainOffers.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900/30">
                      {bargainOffers.map((offer, idx) => (
                        <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 hover:border-gray-700/50 transition-all duration-300 shadow-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">Offer #{idx + 1}: {offer.amount} ETH</p>
                              <p className="text-gray-400 text-sm">Proposer: {offer.proposer.slice(0, 6)}...{offer.proposer.slice(-4)}</p>
                            </div>
                            {acceptedOffers[idx] ? (
                              <>
                                {offer.proposer == address ? (
                                  <button
                                    className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border border-green-700/30 shadow-md transition-all duration-300 px-3 py-1 rounded-md text-sm"
                                    onClick={() => buyNFT(listings[idx].tokenId, offer.amount)}
                                  >
                                    Buy
                                  </button>) : (<span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-700/30">Accepted </span>)
                                }
                              </>
                            ) : (
                              <button
                                onClick={() => handleAcceptOffer(idx)}
                                className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 border border-green-700/30 shadow-md transition-all duration-300 px-3 py-1 rounded-md text-sm"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                      <p className="text-gray-400">No active offers</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gem className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}