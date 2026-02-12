import cron from "node-cron";
import { OrderService } from "./app/modules/order/order.service";


export const initCronJobs = () => {
    cron.schedule("*/10 * * * *", async () => {
        console.log("[Cron] Checking for expired orders...");
        try {
            await OrderService.cancelExpiredOrders();
        } catch (error) {
            console.error("[Cron] Error during expired order cleanup:", error);
        }
    });

    console.log("[Cron] Automatic stock recovery services initialized.");
};
