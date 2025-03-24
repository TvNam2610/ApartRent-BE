import prisma from "../lib/prisma.js";

export const getSaved = async (req, res) => {
  const userId = req.query 

  if (!userId) {
    return res.status(400).json({ message: "User must be logged in to view saved posts" });
  }


  try {
    const savedPosts = await prisma.favoriteList.findMany({
      where: {
        userId: userId,
      },
      include: {
        post: {
          include: {
            realEstate: true,
            user: { select: { username: true, email: true } }
          }
        }, 
      },
    });

    res.status(200).json(savedPosts.map(item => item.post));
  } catch (err) {
    console.error('Error in getSavedPosts:', err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};






