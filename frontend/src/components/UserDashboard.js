import './UserDashboard.css';
import React, { useState, useEffect } from 'react';
import { Reclaim } from '@reclaimprotocol/js-sdk';
import QRCode from "react-qr-code";
import { ethers } from 'ethers';

function UserDashboard({ walletAddress, contract }) {
  const [connected, setConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [setWalletAddress] = useState("");
  const [url, setUrl] = useState('')
  const APP_ID = "0x1D8170DcC668271a0BA0f04F59c1EB8B22b4124D" //TODO: replace with your applicationId
  const reclaimClient = new Reclaim.ProofRequest(APP_ID)
  const [isEligible, setIsEligible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [providerName, setProviderName] = useState('');
  const [proofGenerated, setProofGenerated] = useState(false);



  useEffect(() => {
    checkRegistrationStatus();
    checkEligibility();
  }, []);

  async function checkEligibility() {
    if (contract && walletAddress) {
      try {
        const eligible = await contract.checkAirdropEligibility(walletAddress);
        setIsEligible(eligible);
      } catch (error) {
        console.error("Error checking eligibility:", error);
      }
    }
  }
  async function checkRegistrationStatus() {
    if (contract && walletAddress) {
      try {
        const registered = await contract.isUserRegistered(walletAddress);
        setIsRegistered(registered);
        if (registered) {
          const userInfo = await contract.getUserInfo(walletAddress);
          setProviderName(userInfo.providerName);
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
      }
    }
  }
  async function generateVerificationRequest() {
    const providerId = 'f9f383fd-32d9-4c54-942f-5e9fda349762' //TODO: replace with your provider ids you had selected while creating the application

    reclaimClient.addContext(
      (`user's address: ${walletAddress}`),
      ('for verification on user dashboard')
    )

    await reclaimClient.buildProofRequest(providerId)

    reclaimClient.setSignature(
      await reclaimClient.generateSignature( // this is an MVP, you should not generate the signature on the frontend
        '0xd2f9ca547f366afeed274ee77695cf0be5aa3674492cfb14539938c128b5c198' //TODO : replace with your APP_SECRET
      )
    )

    const { requestUrl, statusUrl } =
      await reclaimClient.createVerificationRequest()

    setUrl(requestUrl)

    await reclaimClient.startSession({
      onSuccessCallback: proof => {
        console.log('Verification success', proof)
        const data = proof.claimData.context.extractedParameters
        // Your business logic here
      },
      onFailureCallback: error => {
        console.error('Verification failed', error)
        // Your business logic here to handle the error
      }
    })
  }
  async function checkEligibility() {
    if (contract) {
      try {
        const eligible = await contract.checkAirdropEligibility(walletAddress);
        setIsEligible(eligible);
      } catch (error) {
        console.error("Error checking eligibility:", error);
      }
    }
  }

  async function handleGenerateQR() {
    const url = await generateVerificationRequest();
    setQrCodeUrl(url);
    setTimeout(() => {
      setProofGenerated(true);
    }, 120000);
  }
  async function connectWallet() {
    if (!connected) {
      // Connect the wallet using ethers.js
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const _walletAddress = await signer.getAddress();
      setConnected(true);
      // setWalletAddress(_walletAddress);
    } else {
      // Disconnect the wallet
      window.ethereum.selectedAddress = null;
      setConnected(false);
      // setWalletAddress("");
      setUrl(''); // Clear the QR code when disconnecting
    }
  }

  return (
    <div className="container">
      <h1>Reclaim App</h1>
      <div className="wallet-section">
        <button onClick={connectWallet}>
          {connected ? "Disconnect Wallet" : "Connect Wallet"}
        </button>
        {connected && (
          <div className="address-display">
            <p>Connected Address</p>
            <span>{walletAddress}</span>
          </div>
        )}
      </div>
      {connected && !url && (
        <button onClick={handleGenerateQR}>Create Claim QR Code</button>
      )}
      {url && (
        <div className="qr-section">
          <QRCode value={url} className="qr-code" />
          {proofGenerated && (
            <p className="proof-submitted">Proof Submitted to Reclaim Contract Successfully</p>
          )}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;