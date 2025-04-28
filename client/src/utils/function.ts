import axios from "axios"
import { toast } from "sonner"

export async function csrf() {
	try {
		await axios.get("http://localhost:8000/sanctum/csrf-cookie")
	} catch (error) {
		console.error(error)
		toast.error(`${error}`)
	}
}

