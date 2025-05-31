  import PayOS from "@payos/node";
  import Database from "../database/database.js";// Nhập lớp Database để thực hiện truy vấn MySQL
  const db = new Database(); // Khởi tạo đối tượng Database

  const payos = new PayOS(
    "c6b57cb6-fb39-45fa-95b9-f6ec9f918462",
    "e46e9212-8bfb-4d29-84c0-d9c6ad0b22e4",
    "1511e5de6ba5981080c614c789f20c6bf295a09fb7aa03dc4fbaf23178438aa4"
  );

  // API để nạp tiền vào ví (tạo link thanh toán)
  // export const depositToWallet = async (req, res) => {
  //   const { userId, amount } = req.body;

  //   if (!userId || amount <= 0) {
  //     return res.status(400).json({ message: "Invalid input data." });
  //   }

  //   try {
  //     // Kiểm tra nếu người dùng chưa có ví
  //     let wallet = await prisma.wallet.findUnique({
  //       where: { userId },
  //     });

  //     if (!wallet) {
  //       // Tạo ví nếu chưa tồn tại
  //       wallet = await prisma.wallet.create({
  //         data: { userId },
  //       });
  //     }

  //     // Tạo giao dịch trên PayOS
  //     const order = {
  //       amount,
  //       description: `Nạp tiền ${userId}`.slice(0, 25), // Cắt mô tả để đảm bảo <= 25 ký tự
  //       orderCode: Date.now(), // Sử dụng timestamp làm mã giao dịch
  //       returnUrl: "http://localhost:8800/api/wallet/callback" , // Truyền thêm amount vào callback URL
  //       cancelUrl: "http://localhost:8800/api/wallet/callback" ,  // Truyền thêm amount vào callback URL
  //     };
      

  //     const paymentLink = await payos.createPaymentLink(order);

  //     // Trả về URL thanh toán cho frontend
  //     res.status(201).json({
  //       success: true,
  //       paymentUrl: paymentLink.checkoutUrl,
  //     });
  //   } catch (error) {
  //     console.error("Error creating deposit payment:", error);
  //     res.status(500).json({ message: "Failed to create deposit payment." });
  //   }
  // };

  // export const handleCallback = async (req, res) => {
  //   const { orderCode, status } = req.body;  // Lấy orderCode và status từ body
  
  //   // Lấy amount từ query params
  //   const amount = req.query.amount || 0;  
  
  //   // Kiểm tra nếu status là PAID và amount hợp lệ
  //   if (status === "PAID" && amount > 0) {
  //     try {
  //       // Cập nhật số dư ví của người dùng
  //       const userId = req.body.userId;  // Lấy userId từ body
  
  //       await prisma.wallet.update({
  //         where: { userId },
  //         data: {
  //           balance: { increment: amount }, // Tăng số dư ví
  //         },
  //       });
  
  //       res.status(200).json({ message: "Payment successful, wallet updated." });
  //     } catch (error) {
  //       console.error("Error handling callback:", error);
  //       res.status(500).json({ message: "Failed to handle callback." });
  //     }
  //   } else {
  //     res.status(400).json({ message: "Payment failed or cancelled." });
  //   }
  // };
  

// API để lấy thông tin ví của người dùng
export const getWallet = async (req, res) => {
    const { userId } = req.query;

    const query = `
        SELECT * FROM wallet WHERE userId = ?
    `;
    try {
        // Kiểm tra userId có tồn tại không
        if (!userId) {
          return res.status(400).json({ message: "userId is required." });
        }
    
        const result = await db.executeQueryAsyncDB(query, [userId])
        res.status(200).json(result)
    } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ message: "Failed to fetch wallet." });
    }
};
    
//Trừ tiền ví 
export const deductBalance = async (req, res) => {
    const { userId, balance } = req.body;
  
    if (!userId || !balance) {
      return res.status(400).json({ message: "userId và balance là bắt buộc." });
    }
  
    try {
      // 1. Lấy số dư hiện tại
      const selectQuery = `SELECT balance FROM wallet WHERE userId = ?`;
      const wallet = await db.executeQueryAsyncDB(selectQuery, [userId]);
  
      if (!wallet) {
        return res.status(404).json({ message: "Không tìm thấy ví." });
      }
  
      if (wallet.balance < balance) {
        return res.status(400).json({ message: "Số dư không đủ." });
      }
  
      // 2. Cập nhật số dư mới
      const updateQuery = `UPDATE wallet SET balance = balance - ? WHERE userId = ?`;
      await db.executeQueryAsyncDB(updateQuery, [balance, userId]);
  
      return res.status(200).json({ message: "Trừ tiền thành công." });
    } catch (error) {
      console.error("Lỗi khi trừ tiền:", error);
      return res.status(500).json({ message: "Lỗi server khi trừ tiền." });
    }
};


export const depositToWallet = async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || amount <= 0) {
    return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
  }

  try {
    // Kiểm tra xem ví đã tồn tại chưa
    const checkWalletQuery = `SELECT * FROM wallet WHERE userId = ?`;
    const wallet = await db.executeQueryAsyncDB(checkWalletQuery, [userId]);

    // Nếu ví chưa tồn tại, tạo mới
    if (!wallet) {
      const createWalletQuery = `INSERT INTO wallet (userId, balance) VALUES (?, 0)`;
      await db.executeQueryAsyncDB(createWalletQuery, [userId]);
    }

    // Tạo thông tin thanh toán
    const orderCode = Date.now();
    const order = {
      amount,
      description: `Nạp tiền ${userId}`.slice(0, 25),
      orderCode,
      returnUrl: `http://localhost:5173/callback?userId=${userId}&amount=${amount}&status=PAID`,
      cancelUrl: `http://localhost:5173/callback?userId=${userId}&amount=${amount}&status=FAILED`,
    };

    // Giả sử hàm `createPaymentLink` trả về URL thanh toán
    const paymentLink = await payos.createPaymentLink(order);

    return res.status(201).json({
      success: true,
      paymentUrl: paymentLink.checkoutUrl,
    });
  } catch (error) {
    console.error("Lỗi khi tạo thanh toán:", error);
    return res.status(500).json({ success: false, message: "Lỗi khi tạo thanh toán." });
  }
};

/**
 * Xử lý callback sau khi thanh toán
 */
export const handleCallback = async (req, res) => {
  const { userId, amount, status } = req.query;

  if (!userId || !amount || !status) {
    return res.status(400).json({ success: false, message: "Dữ liệu callback không hợp lệ." });
  }

  try {
    // Kiểm tra ví người dùng
    const checkWalletQuery = `SELECT balance FROM wallet WHERE userId = ?`;
    const wallet = await db.executeQueryAsyncDB(checkWalletQuery, [userId]);

    if (!wallet[0]) {
      return res.status(404).json({ success: false, message: "Không tìm thấy ví." });
    }

    const currentBalance = parseFloat(wallet[0].balance);
    const depositAmount = parseFloat(amount);

    console.log("Số dư hiện tại:", currentBalance);
    console.log("Trạng thái thanh toán:", status);

    // Cập nhật số dư nếu thanh toán thành công
   
      const newBalance = currentBalance + depositAmount;

      const updateBalanceQuery = `UPDATE wallet SET balance = ? WHERE userId = ?`;
      await db.executeQueryAsyncDB(updateBalanceQuery, [newBalance, userId]);

      console.log("Số dư sau khi cập nhật:", newBalance);

      return res.status(200).json({ success: true, message: "Nạp tiền thành công.", newBalance });
    

   

  } catch (error) {
    console.error("Lỗi khi xử lý callback:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi xử lý callback." });
  }
};


/**
 * Cập nhật số dư ví (rút tiền)
 */
export const updateWallet = async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || amount <= 0) {
    return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
  }

  try {
    // Kiểm tra ví người dùng
    const checkWalletQuery = `SELECT balance FROM wallet WHERE userId = ?`;
    const wallet = await db.executeQueryAsyncDB(checkWalletQuery, [userId]);

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Ví không tồn tại." });
    }

    const newBalance = wallet.balance - parseFloat(amount);

    // Kiểm tra số dư có đủ không
    if (newBalance < 0) {
      return res.status(400).json({ success: false, message: "Số dư không đủ." });
    }

    // Cập nhật số dư mới
    const updateBalanceQuery = `UPDATE wallet SET balance = ? WHERE userId = ?`;
    await db.executeQueryAsyncDB(updateBalanceQuery, [newBalance, userId]);

    console.log(newBalance)

    return res.status(200).json({
      success: true,
      message: "Cập nhật số dư thành công.",
      balance: newBalance
    });

  } catch (error) {
    console.error("Lỗi khi cập nhật ví:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi cập nhật ví." });
  }
};
  

    // export const depositToWallet = async (req, res) => {
    //   const { userId, amount } = req.body;
    
    //   if (!userId || amount <= 0) {
    //     return res.status(400).json({ message: "Invalid input data." });
    //   }
    
    //   try {
    //     let wallet = await prisma.wallet.findUnique({
    //       where: { userId },
    //     });
    
    //     if (!wallet) {
    //       wallet = await prisma.wallet.create({
    //         data: { userId },
    //       });
    //     }
    
    //     const order = {
    //       amount,
    //       description: `Nạp tiền ${userId}`.slice(0, 25),
    //       orderCode: Date.now(),
    //       returnUrl: `http://localhost:8800/api/wallet/callback?userId=${userId}&amount=${amount}`, // Gửi userId và amount vào URL
    //       cancelUrl: `http://localhost:8800/api/wallet/callback?userId=${userId}&amount=${amount}`, // Gửi userId và amount vào URL
    //     };
    
    //     const paymentLink = await payos.createPaymentLink(order);
    
    //     res.status(201).json({
    //       success: true,
    //       paymentUrl: paymentLink.checkoutUrl,
    //     });
    //   } catch (error) {
    //     console.error("Error creating deposit payment:", error);
    //     res.status(500).json({ message: "Failed to create deposit payment." });
    //   }
    // };
// export const handleCallback = async (req, res) => {
//       const { status } = req.body; // PayOS gửi status (PAID / FAILED)
//       const amount = req.query.amount || 0; // Số tiền nạp từ query params
//       const userId = req.query.userId; // userId từ query params
    
//       if (status === "PAID" && amount > 0 && userId) {
//         try {
//           // Cập nhật số dư ví của người dùng
//           await prisma.wallet.update({
//             where: { userId },
//             data: {
//               balance: { increment: amount }, // Tăng số dư ví
//             },
//           });
    
//           res.status(200).json({ message: "Payment successful, wallet updated." });
//         } catch (error) {
//           console.error("Error handling callback:", error);
//           res.status(500).json({ message: "Failed to handle callback." });
//         }
//       } else {
//         res.status(400).json({ message: "Payment failed or cancelled." });
//       }
//     };
    
// export const depositToWallet = async (req, res) => {
//   const { userId, amount } = req.body;

//   if (!userId || amount <= 0) {
//       return res.status(400).json({ message: "Invalid input data." });
//   }

//   try {
//       let wallet = await prisma.wallet.findUnique({
//           where: { userId },
//       });

//       if (!wallet) {
//           wallet = await prisma.wallet.create({
//               data: { userId },
//           });
//       }

//       const order = {
//           amount,
//           description: `Nạp tiền ${userId}`.slice(0, 25),
//           orderCode: Date.now(),
//           returnUrl: `http://localhost:5173/callback?userId=${userId}&amount=${amount}`, // Frontend URL
//           cancelUrl: `http://localhost:5173/callback?userId=${userId}&amount=${amount}`, // Frontend URL
//       };

//       const paymentLink = await payos.createPaymentLink(order);

//       res.status(201).json({
//           success: true,
//           paymentUrl: paymentLink.checkoutUrl,
//       });
//   } catch (error) {
//       console.error("Error creating deposit payment:", error);
//       res.status(500).json({ message: "Failed to create deposit payment." });
//   }
// };
// export const handleCallback = async (req, res) => {
//   const { userId, amount, status } = req.query;

//   if (!userId || !amount || !status) {
//       return res.status(400).json({ message: "Invalid callback data." });
//   }

//   try {
//       let wallet = await prisma.wallet.findUnique({
//           where: { userId },
//       });

//       if (!wallet) {
//           return res.status(404).json({ message: "Wallet not found." });
//       }

//       console.log("Current wallet balance:", wallet.balance);
//       console.log("Status:", status);
//       // Cập nhật số dư ví nếu thanh toán thành công
//       if (status === 'PAID') {
//           wallet.balance += parseFloat(amount);
//           await prisma.wallet.update({
//               where: { userId },
//               data: { balance: wallet.balance },
//           });
//           console.log("Updated wallet balance:", wallet.balance);
//           return res.status(200).json({ message: "Payment successful." });
//       } else {
//           return res.status(200).json({ message: "Payment failed." });
//       }
//   } catch (error) {
//       console.error("Error handling callback:", error);
//       return res.status(500).json({ message: "Error processing callback." });
//   }
// };

// export const updateWallet = async (req, res) => {
//   const { userId, amount } = req.body;

//   try {
//       // Kiểm tra nếu user tồn tại
//       const user = await prisma.user.findUnique({
//           where: { id: userId },
//           include: { wallet: true },
//       });

//       if (!user) {
//           return res.status(404).send({ message: 'User not found' });
//       }

//       if (!user.wallet) {
//           return res.status(400).send({ message: 'User does not have a wallet' });
//       }

//       // Tính số dư mới
//       const newBalance = user.wallet.balance - amount;

//       // Kiểm tra số dư có đủ không
//       if (newBalance < 0) {
//           return res.status(400).send({ message: 'Insufficient wallet balance' });
//       }

//       // Cập nhật số dư trong ví
//       const updatedWallet = await prisma.wallet.update({
//           where: { id: user.wallet.id },
//           data: { balance: newBalance },
//       });

//       res.status(200).send({
//           message: 'Wallet updated successfully',
//           walletBalance: updatedWallet.balance,
//       });
//   } catch (error) {
//       console.error('Error updating wallet:', error);
//       res.status(500).send({ message: 'Failed to update wallet' });
//   }
// };

