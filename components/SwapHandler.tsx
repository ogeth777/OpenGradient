"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { injected } from "wagmi/connectors";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { Loader2, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import axios from "axios";

interface SwapHandlerProps {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  tokenInAddr: string;
  tokenOutAddr: string;
  amountAtomic: string;
  chain: string;
}

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export function SwapHandler({
  tokenIn,
  tokenOut,
  amount,
  tokenInAddr,
  tokenOutAddr,
  amountAtomic,
  chain
}: SwapHandlerProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [route, setRoute] = useState<any>(null);
  const [routerAddress, setRouterAddress] = useState<string>("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction States
  const { data: hash, isPending: isSwapPending, sendTransaction } = useSendTransaction();
  const { writeContractAsync, isPending: isApprovePending } = useWriteContract();
  
  // Allowance Check
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenInAddr as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, routerAddress as `0x${string}`],
    query: {
        enabled: isConnected && tokenInAddr !== NATIVE_ETH && !!routerAddress,
    }
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch Route on Mount
  useEffect(() => {
    fetchRoute();
  }, [tokenInAddr, tokenOutAddr, amountAtomic]);

  const fetchRoute = async () => {
    setLoadingRoute(true);
    setError(null);
    try {
      const url = `https://aggregator-api.kyberswap.com/${chain}/api/v1/routes?tokenIn=${tokenInAddr}&tokenOut=${tokenOutAddr}&amountIn=${amountAtomic}`;
      const res = await axios.get(url);
      if (res.data.code !== 0) throw new Error(res.data.message);
      
      setRoute(res.data.data.routeSummary);
      setRouterAddress(res.data.data.routerAddress);
    } catch (err: any) {
      setError(err.message || "Failed to fetch swap route");
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleApprove = async () => {
    if (!routerAddress) return;
    try {
      await writeContractAsync({
        address: tokenInAddr as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [routerAddress as `0x${string}`, BigInt(amountAtomic)],
      });
      // Wait for approval? ideally useWaitForTransactionReceipt for approval too
      // For simplicity, we just trigger refetch after a delay or optimistically
      setTimeout(refetchAllowance, 5000); 
    } catch (err: any) {
      setError("Approval failed: " + err.message);
    }
  };

  const handleSwap = async () => {
    if (!route || !address) return;
    try {
      // 1. Build Transaction
      const buildRes = await axios.post(
        `https://aggregator-api.kyberswap.com/${chain}/api/v1/route/build`,
        {
          routeSummary: route,
          sender: address,
          recipient: address,
          slippageTolerance: 50, // 0.5% (bps)
        }
      );

      if (buildRes.data.code !== 0) throw new Error(buildRes.data.message);
      
      const { data: txData } = buildRes.data;

      // 2. Send Transaction
      sendTransaction({
        to: txData.routerAddress as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(txData.amountIn), // if native ETH
      });

    } catch (err: any) {
      setError("Swap failed: " + err.message);
    }
  };

  const isApprovalNeeded = tokenInAddr !== NATIVE_ETH && allowance !== undefined && allowance < BigInt(amountAtomic);

  if (isConfirmed) {
    return (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-green-400 font-bold">SWAP SUCCESSFUL</div>
            <a 
                href={`https://basescan.org/tx/${hash}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-green-600 underline mt-2 block"
            >
                View on Explorer
            </a>
        </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 p-4 rounded max-w-sm mt-4">
      <div className="flex justify-between items-center mb-4 border-b border-green-900/30 pb-2">
        <div className="text-xs text-green-600 uppercase tracking-widest">Swap Execution</div>
        {loadingRoute && <Loader2 className="w-3 h-3 animate-spin text-green-500" />}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-green-600">Sell</span>
          <span className="text-green-400 font-bold">{amount} {tokenIn}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-green-600">Buy (Est.)</span>
          <span className="text-green-400 font-bold">
            {route ? parseFloat(route.amountOut).toFixed(4) : "..."} {tokenOut}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-xs mb-4 flex items-center gap-2 bg-red-900/10 p-2 rounded">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={() => connect({ connector: injected() })}
          className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-2 rounded flex items-center justify-center gap-2"
        >
          <Wallet className="w-4 h-4" /> Connect Wallet
        </button>
      ) : (
        <div className="space-y-2">
          {isApprovalNeeded ? (
            <button
              onClick={handleApprove}
              disabled={isApprovePending}
              className="w-full bg-yellow-600/20 border border-yellow-600 text-yellow-500 hover:bg-yellow-600/30 font-bold py-2 rounded flex items-center justify-center gap-2"
            >
              {isApprovePending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve " + tokenIn}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isSwapPending || loadingRoute || !route}
              className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSwapPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Swap"}
            </button>
          )}
        </div>
      )}
      
      {hash && (
          <div className="text-xs text-center mt-2 text-green-600 animate-pulse">
              Transaction Pending...
          </div>
      )}
    </div>
  );
}
