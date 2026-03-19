import axios from "axios";

export async function sendResult(url: string, data: any) {

  try {

    const res = await axios.post(url, data);

    return res.status;

  } catch (error) {

    return 500;

  }

}