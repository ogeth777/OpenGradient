"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWriteContract, useReadContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { Loader2, CheckCircle, AlertCircle, Wallet, X, ArrowRight, Info } from "lucide-react";
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
  
  const [route, setRoute] = useState<any>(null);
  const [routerAddress, setRouterAddress] = useState<string>("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState(false);
  
  // Transaction States
  const { data: hash, isPending: isSwapPending, sendTransaction } = useSendTransaction();
  const { writeContractAsync, isPending: isApprovePending, data: approveHash } = useWriteContract();
  
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

  // Wait for Tx Receipts
  const { isLoading: isConfirmingSwap, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash });
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Refetch allowance after approval confirmation
  useEffect(() => {
    if (isApproveSuccess) {
        refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

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
    } catch (err: any) {
      setError("Approval failed: " + err.message);
    }
  };

  const handleSwap = async () => {
    if (!route || !address) return;
    try {
      const buildRes = await axios.post(
        `https://aggregator-api.kyberswap.com/${chain}/api/v1/route/build`,
        {
          routeSummary: route,
          sender: address,
          recipient: address,
          slippageTolerance: 50, // 0.5%
        }
      );

      if (buildRes.data.code !== 0) throw new Error(buildRes.data.message);
      
      const { data: txData } = buildRes.data;

      sendTransaction({
        to: txData.routerAddress as `0x${string}`,
        data: txData.data as `0x${string}`,
        value: BigInt(txData.amountIn),
      });

    } catch (err: any) {
      setError("Swap failed: " + err.message);
    }
  };

  const isApprovalNeeded = tokenInAddr !== NATIVE_ETH && allowance !== undefined && allowance < BigInt(amountAtomic);
  const amountOut = route ? parseFloat(formatUnits(BigInt(route.amountOut), route.tokenOut.decimals || 18)).toFixed(6) : "...";
  const exchangeRate = route ? (parseFloat(amountOut) / parseFloat(amount)).toFixed(6) : "...";

  if (isRejected) {
      return (
          <div className="bg-red-900/10 border border-red-900/30 p-4 rounded text-center text-red-400 text-sm">
              <X className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Swap Rejected by User
          </div>
      );
  }

  if (isSwapSuccess) {
    return (
        <div className="bg-[#111] border border-green-900/50 rounded-lg p-6 max-w-md font-sans shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white mb-6">Swap Summary</h3>
            
            <ul className="space-y-4 mb-6 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>Selling: <strong className="text-white">{amount} {tokenIn}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>Receiving: <strong className="text-white">{amountOut} {tokenOut}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>Exchange Rate: 1 {tokenIn} = {exchangeRate} {tokenOut}</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>Chain: <span className="capitalize">{chain}</span> (ID: 8453)</span>
                </li>
            </ul>

            <div className="mb-6">
                <h4 className="font-bold text-white mb-2">Transaction Details</h4>
                <p className="text-sm text-gray-400">
                    You can view your transaction on the explorer:{" "}
                    <a 
                        href={`https://basescan.org/tx/${hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-white underline hover:text-green-400 transition-colors"
                    >
                        View on Basescan
                    </a>
                </p>
            </div>

            <div className="bg-gray-900/50 p-4 rounded border border-gray-800">
                <h4 className="font-bold text-white mb-2 text-sm">Next Steps</h4>
                <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
                    <li>If you need to perform more swaps, feel free to ask!</li>
                    <li>Always ensure you have enough ETH for gas.</li>
                </ul>
            </div>
        </div>
    );
  }

  // Approval Required State
  if (isApprovalNeeded && !isSwapPending && !isConfirmingSwap && !isSwapSuccess) {
      return (
        <div className="bg-[#1a1a1a] border border-yellow-600/30 rounded-lg p-6 max-w-md font-sans shadow-xl mt-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
            
            <div className="flex items-center gap-2 mb-4 text-yellow-500">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Approval Required</span>
            </div>

            <div className="mb-6 space-y-3">
                <h3 className="text-white font-bold mb-2">Swap Details:</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                        <span>Selling</span>
                        <span className="text-white font-mono">{amount} {tokenIn}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                        <span>Receiving (Est.)</span>
                        <span className="text-white font-mono">{loadingRoute ? "..." : amountOut} {tokenOut}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                        <span>Rate</span>
                        <span className="text-white font-mono">1 {tokenIn} ≈ {exchangeRate} {tokenOut}</span>
                    </li>
                    <li className="flex justify-between">
                        <span>Chain</span>
                        <span className="text-white capitalize">{chain}</span>
                    </li>
                </ul>
            </div>

            <p className="text-sm text-gray-400 mb-6">
                You need to approve the use of your {tokenIn} before swapping.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={handleApprove}
                    disabled={isApprovePending || isConfirmingApprove}
                    className="flex-1 bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    {isApprovePending || isConfirmingApprove ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Approving...
                        </>
                    ) : (
                        "Approve"
                    )}
                </button>
                <button
                    onClick={() => setIsRejected(true)}
                    className="flex-1 bg-transparent border border-gray-700 text-white font-bold py-3 rounded hover:bg-gray-800 transition-colors"
                >
                    Reject
                </button>
            </div>
        </div>
      );
  }

  // Default Swap State (Ready or Loading)
  return (
    <div className="bg-[#0a0a0a] border border-green-900/30 rounded-lg p-5 max-w-md font-sans shadow-xl mt-4">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xs text-green-600 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Ready to Swap
        </div>
        {loadingRoute && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
      </div>

      <div className="space-y-4 mb-6 relative">
        <div className="bg-black/40 p-4 rounded border border-green-900/20">
            <div className="text-xs text-gray-500 mb-1">You Pay</div>
            <div className="text-2xl font-bold text-white font-mono">{amount} <span className="text-green-500 text-lg">{tokenIn}</span></div>
        </div>
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] border border-green-900/30 p-1 rounded-full text-green-500 z-10">
            <ArrowRight className="w-4 h-4 rotate-90" />
        </div>

        <div className="bg-black/40 p-4 rounded border border-green-900/20">
            <div className="text-xs text-gray-500 mb-1">You Receive</div>
            <div className="text-2xl font-bold text-white font-mono">{loadingRoute ? "..." : amountOut} <span className="text-green-500 text-lg">{tokenOut}</span></div>
            <div className="text-xs text-gray-600 mt-1">
                Rate: 1 {tokenIn} ≈ {exchangeRate} {tokenOut}
            </div>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-xs mb-4 flex items-center gap-2 bg-red-900/10 p-3 rounded border border-red-900/30">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={() => connect({ connector: injected() })}
          className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded flex items-center justify-center gap-2 transition-all"
        >
          <Wallet className="w-4 h-4" /> Connect Wallet
        </button>
      ) : (
        <div className="space-y-3">
             <button
              onClick={handleSwap}
              disabled={isSwapPending || loadingRoute || !route || isConfirmingSwap}
              className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
            >
              {isSwapPending || isConfirmingSwap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 
                    {isConfirmingSwap ? "Confirming..." : "Processing..."}
                  </>
              ) : (
                  "Confirm Swap"
              )}
            </button>
            <button 
                onClick={() => setIsRejected(true)}
                className="w-full text-xs text-gray-500 hover:text-white transition-colors py-2"
            >
                Cancel Transaction
            </button>
        </div>
      )}
    </div>
  );
}
