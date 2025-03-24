import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { ObjectId } from 'mongodb';


// export const getPosts = async (req, res) => {
//   const { type } = req.query; // Nhận tham số "type" từ query string, sẽ là "rent" hoặc "buy"

//   try {
//     const posts = await prisma.post.findMany({
//       where: {
//         status: "PENDING", // Chỉ lấy các bài đăng đã được phê duyệt
//         realEstate: {
//           status: type === "rent" ? "FOR_RENT" : "FOR_SALE", // Lọc theo loại "FOR_RENT" hoặc "FOR_SALE"
//         },
//       },
//       include: {
//         realEstate: true,  // Bao gồm thông tin bất động sản liên quan
//         user: {
//           select: {
//             username: true,
//             avatar: true,
//           },
//         },
//       },
//     });

//     if (posts.length === 0) {
//       return res.status(404).json({ message: "Không tìm thấy bài đăng phù hợp." });
//     }

//     res.status(200).json(posts);
//   } catch (err) {
//     console.error("Error fetching posts: ", err);
//     res.status(500).json({ message: "Failed to get posts" });
//   }
// };

// export const getPosts = async (req, res) => {
//   const { type, bedrooms, priceRange, features, searchQuery } = req.query; // Nhận thêm các tham số từ query string

//   try {
//     const filter = {
//       status: "PENDING",
//       realEstate: {
//         status: type === "rent" ? "FOR_RENT" : "FOR_SALE",
//       },
//     };

//     // Lọc theo số phòng ngủ
//     if (bedrooms) {
//       filter.realEstate.bedrooms = +bedrooms; // Chuyển thành số để so sánh
//     }

//     // Lọc theo khoảng giá
//     if (priceRange) {
//       const [minPrice, maxPrice] = priceRange.split('-').map(Number);
//       filter.realEstate.price = {
//         ...(minPrice && { gte: minPrice }), // Giá lớn hơn hoặc bằng minPrice
//         ...(maxPrice && { lte: maxPrice }), // Giá nhỏ hơn hoặc bằng maxPrice
//       };
//     }

//     // Lọc theo từ khóa tìm kiếm
//     if (searchQuery) {
//       filter.OR = [
//         { title: { contains: searchQuery, mode: 'insensitive' } },  // Tìm kiếm không phân biệt chữ hoa chữ thường
//         { realEstate: { location: { contains: searchQuery, mode: 'insensitive' } } },
//       ];
//     }

//     const posts = await prisma.post.findMany({
//       where: filter,
//       include: {
//         realEstate: true,
//         user: {
//           select: {
//             username: true,
//             avatar: true,
//           },
//         },
//         favoriteList:true
//       },
//     });

//     if (posts.length === 0) {
//       return res.status(404).json({ message: "Không tìm thấy bài đăng phù hợp." });
//     }

//     res.status(200).json(posts);
//   } catch (err) {
//     console.error("Error fetching posts: ", err);
//     res.status(500).json({ message: "Failed to get posts" });
//   } 
// };



// export const getPosts = async (req, res) => {
//   try {
//     const posts = await prisma.post.findMany({
    
//       include: {
//         realEstate: true,  
//         user: {
//           select: {
//             username: true,  
//             avatar: true,   
//           },
//         },
//       },
//     });

//     res.status(200).json(posts);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get posts" });
//   }
// };
// File: controllers/postController.js
export const getPosts = async (req, res) => {
  const {
    page = 1,               
    limit = 10,             
    postStatus,           
    realEstateStatus,       
    minPrice,              
    maxPrice,  
    minArea,
    maxArea,           
    searchQuery,            
    bedrooms,
  } = req.query;

  const skip = (page - 1) * limit; // Tính toán số bản ghi cần bỏ qua

  try {
    // Tạo bộ lọc động dựa trên các tham số truyền vào
    const filters = {
      status: postStatus || undefined,
      // title: searchQuery? { contains: searchQuery, mode: "insensitive" }   : undefined, 
      realEstate: {
        status: realEstateStatus || undefined,
        price: {
          gte: minPrice ? parseFloat(minPrice) : undefined,
          lte: maxPrice ? parseFloat(maxPrice) : undefined
        },
        area: {
          gte: minArea ? parseFloat(minArea) : undefined,
          lte: maxArea ? parseFloat(maxArea) : undefined
        },
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        location: searchQuery? { contains: searchQuery, mode: "insensitive" }   : undefined, 
      },
     
    };

    // Tìm kiếm danh sách bài đăng với các bộ lọc và phân trang
    const posts = await prisma.post.findMany({
      where: filters,
      include: {
        realEstate: true,
        user: { select: { username: true, email: true } }
      },
      skip,
      take: parseInt(limit),
    });

    // Đếm tổng số bài đăng để hỗ trợ phân trang
    const totalCount = await prisma.post.count({
      where: filters
    });

    res.status(200).json({
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      posts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve posts" });
  }
};



export const getPost = async (req, res) => {
  const id = req.params.id;

  // Kiểm tra id có phải là ObjectId hợp lệ hay không
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid postId format' });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: new ObjectId(id) },
      include: {
        realEstate: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        favoriteList: true
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.status(200).json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

// export const getPost = async (req, res) => {
//   const id = req.params.id;
  
//   try {
//     const post = await prisma.post.findUnique({
//       where: { id },
//       include: {
//         realEstate: true,
//         user: {
//           select: {
//             username: true,
//             avatar: true,
//           },
//         },
//       },
//     });

//     // const token = req.cookies?.token;

//     // if (token) {
//     //   jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
//     //     if (!err) {
//     //       const saved = await prisma.savedPost.findUnique({
//     //         where: {
//     //           userId_postId: {
//     //             postId: id,
//     //             userId: payload.id,
//     //           },
//     //         },
//     //       });
//     //       res.status(200).json({ ...post, isSaved: saved ? true : false });
//     //     }
//     //   });
//     // }
//     // res.status(200).json({ ...post, isSaved: false });
//     res.status(200).json(post);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get post" });
//   }
// };

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        user: { 
            connect: { id: tokenUserId }
          },
        realEstate: {
          create: body.realEstate,
        },
      },  
    });
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    res.status(200).json();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update posts" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};





export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  if (!ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid postId format' });
  }

  console.log('Received postId:', postId);
  console.log('UserId:', tokenUserId);

  try {
    const savedPost = await prisma.favoriteList.findUnique({
      where: {
        userId: tokenUserId,
        postId,
      },
    });

    if (savedPost) {
      await prisma.favoriteList.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: "Post removed from saved list" });
    } else {
      await prisma.favoriteList.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      res.status(200).json({ message: "Post saved" });
    }
  } catch (err) {
    console.error('Error in savePost:', err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};


export const updatePostStatus = async (req, res) => {
  const { id } = req.params; 
  const { status } = req.body;

  // Kiểm tra trạng thái hợp lệ
  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Xác minh định dạng ID
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Tìm bài viết
    const post = await prisma.post.findUnique({
      where: { id: id },
    });

    if (!post) {
      return res.status(404).json({ message: `Post with ID ${id} not found` });
    }

    // Kiểm tra nếu trạng thái không thay đổi
    if (post.status === status) {
      return res.status(200).json({ message: "Status already updated", post });
    }

    // Cập nhật trạng thái
    const updatedPost = await prisma.post.update({
      where: { id: id },
      data: { status },
    });

    res.status(200).json({ message: "Post status updated", post: updatedPost });
  } catch (err) {
    // Xử lý lỗi Prisma
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Post not found" });
    }
    console.error("Error updating post status:", err);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
};




// export const createPostWithPackage = async (req, res) => {
//   const { postData, realEstate, packageId } = req.body;
//   const tokenUserId = req.userId;

//   try {
//       // Lấy thông tin gói tin
//       const selectedPackage = await prisma.package.findUnique({
//           where: { id: packageId },
//       });

//       if (!selectedPackage) {
//           return res.status(404).json({ message: 'Package not found' });
//       }

//       // Lấy thông tin ví của người dùng
//       const userWallet = await prisma.wallet.findUnique({
//           where: { userId: tokenUserId },
//       });

//       if (!userWallet) {
//           return res.status(404).json({ message: 'Wallet not found' });
//       }

//       // Kiểm tra số dư
//       if (userWallet.balance < selectedPackage.price) {
//           return res.status(400).json({
//               message: 'Insufficient balance. Please recharge your wallet.',
//           });
//       }

//       // Trừ tiền trong ví
//       await prisma.wallet.update({
//           where: { userId: tokenUserId },
//           data: {
//               balance: userWallet.balance - selectedPackage.price,
//           },
//       });

//       // Tạo bài đăng
//       const newPost = await prisma.post.create({
//           data: {
//               ...postData,
//               user: { connect: { id: tokenUserId } },
//               realEstate: { create: realEstate },
//               package: { connect: { id: packageId } }, // Gắn gói tin vào bài đăng
//           },
//       });

//       res.status(200).json(newPost);
//   } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: 'Failed to create post' });
//   }
// };