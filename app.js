import { ethers } from "./ethers.min.js"
import { abi, contractAddress } from './constants.js'

console.log('Mounted!')
const connectBtn = document.querySelector('#connectBtn');
const getBalance = document.querySelector('#getBalance')
const fundBtn = document.querySelector('#fundBtn');
const withdrawBtn = document.querySelector('#withdrawBtn')
connectBtn.addEventListener('click', connect);
fundBtn.addEventListener('click', fund);
getBalance.addEventListener('click', getBalance)
withdrawBtn.addEventListener('click', withdraw)

async function connect() {
	if (typeof window.ethereum !== "undefined") {
		try {
			await window.ethereum.request({ method: "eth_requestAccounts" });
			console.log("Connected to MetaMask!");
			connectBtn.innerHTML = 'Connected';
		} catch (error) {
			console.error(error);
		}
	} else {
		connectBtn.innerHTML = 'Please Install MetaMask'
		console.log("MetaMask isn't Installed");
	}
}

async function fund() {
	const ethAmount = document.querySelector('#depositEth').value
	const eth = await ethers.parseEther(`${ethAmount}`);
	if (typeof window.ethereum !== "undefined") {
		let signer = null;

		let provider;
		if (window.ethereum == null) {

			console.log("MetaMask not installed; using read-only defaults")
			provider = ethers.getDefaultProvider()

		} else {
			provider = new ethers.BrowserProvider(window.ethereum)
			signer = await provider.getSigner();
		}
		const contract = new ethers.Contract(contractAddress, abi, signer);
		try {
			const txResponse = await contract.fund({ value: eth })
			await listenForTxMine(txResponse, provider).then(() => console.log('Done'));

		} catch (error) {
			if (error.code === 4001) {
				console.error('User denied transaction signature.');
			} else {
				console.error('Error:', error);
			}
		}
	}
}

async function getBalance() {
	if (typeof window.ethereum !== "undefined") {
		let provider = new ethers.BrowserProvider(window.ethereum)
		try {
			const balance = await provider.getBalance(contractAddress);
			console.log(ethers.formatEther(balance))
		} catch (error) {
			console.error(error);
		}
	}
}

async function withdraw() {
	console.log(`Withdrawing...`)
	if (typeof window.ethereum !== "undefined") {
		const provider = new ethers.BrowserProvider(window.ethereum)
		await provider.send('eth_requestAccounts', [])
		const signer = await provider.getSigner()
		const contract = new ethers.Contract(contractAddress, abi, signer)
		try {
			const transactionResponse = await contract.withdraw()
			await listenForTxMine(transactionResponse, provider)
			// await transactionResponse.wait(1)
		} catch (error) {
			console.log(error)
		}
	} else {
		withdrawBtn.innerHTML = "Please install MetaMask"
	}
}

function listenForTxMine(txResponse, provider) {
	console.log(`Mining ${txResponse.hash}.....`)
	return new Promise(resolve, reject => {
		try {
			provider.once(txResponse.hash, (txReciept) => {
				console.log(`Completed with ${txReciept.confirmations} confirmations`)
			})
			resolve();
		} catch (error) {
			reject(error)
		}
	})
}
