import { Hono } from 'hono';
import { prisma, broadcastToUser } from '../index';
// import { sendPushNotification } from './notifications';

export const forumRoutes = new Hono();

// ============================================================================
// POSTS
// ============================================================================

// GET /api/forums/posts - List posts with filters
forumRoutes.get('/posts', async (c) => {
  try {
    const category = c.req.query('category');
    const sort = c.req.query('sort') || 'recent';
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const lat = c.req.query('lat') ? parseFloat(c.req.query('lat')!) : null;
    const lng = c.req.query('lng') ? parseFloat(c.req.query('lng')!) : null;

    // Build where clause
    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { likesCount: 'desc' };
    }
    // For 'nearby' sort, we'll post-process

    const posts = await prisma.forumPost.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
                trustScore: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Transform response
    let results = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      isPinned: post.isPinned,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      location: post.locationName
        ? {
            name: post.locationName,
            latitude: post.latitude,
            longitude: post.longitude,
          }
        : null,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.author.id,
        name: post.author.name,
        displayName: post.author.profile?.displayName || post.author.name,
        avatar: post.author.profile?.avatar,
        trustScore: post.author.profile?.trustScore || 50,
      },
    }));

    // Sort by distance if nearby and we have coordinates
    if (sort === 'nearby' && lat && lng) {
      results = results
        .filter((p) => p.location?.latitude && p.location?.longitude)
        .map((p) => ({
          ...p,
          distance: getDistance(lat, lng, p.location!.latitude!, p.location!.longitude!),
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Pinned posts first
    results.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    return c.json({ posts: results });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// GET /api/forums/posts/:id - Get single post with comments
forumRoutes.get('/posts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.req.header('x-user-id');

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
                trustScore: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Check if user has liked
    let isLiked = false;
    if (userId) {
      const like = await prisma.forumPostLike.findUnique({
        where: { postId_userId: { postId: id, userId } },
      });
      isLiked = !!like;
    }

    // Check which comments user has liked
    let likedCommentIds: string[] = [];
    if (userId) {
      const likedComments = await prisma.forumCommentLike.findMany({
        where: {
          userId,
          commentId: { in: post.comments.map((c) => c.id) },
        },
        select: { commentId: true },
      });
      likedCommentIds = likedComments.map((l) => l.commentId);
    }

    return c.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        isPinned: post.isPinned,
        likesCount: post._count.likes,
        isLiked,
        location: post.locationName
          ? {
              name: post.locationName,
              latitude: post.latitude,
              longitude: post.longitude,
            }
          : null,
        createdAt: post.createdAt.toISOString(),
        author: {
          id: post.author.id,
          name: post.author.name,
          displayName: post.author.profile?.displayName || post.author.name,
          avatar: post.author.profile?.avatar,
          trustScore: post.author.profile?.trustScore || 50,
        },
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          likesCount: comment._count.likes,
          isLiked: likedCommentIds.includes(comment.id),
          parentId: comment.parentId,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.author.id,
            name: comment.author.name,
            displayName: comment.author.profile?.displayName || comment.author.name,
            avatar: comment.author.profile?.avatar,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return c.json({ error: 'Failed to fetch post' }, 500);
  }
});

// POST /api/forums/posts - Create new post
forumRoutes.post('/posts', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, content, category, location } = body;

    if (!title || !content || !category) {
      return c.json({ error: 'Title, content, and category are required' }, 400);
    }

    const post = await prisma.forumPost.create({
      data: {
        authorId: userId,
        title,
        content,
        category,
        locationName: location?.name,
        latitude: location?.latitude,
        longitude: location?.longitude,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return c.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        likesCount: 0,
        commentsCount: 0,
        location: post.locationName
          ? {
              name: post.locationName,
              latitude: post.latitude,
              longitude: post.longitude,
            }
          : null,
        createdAt: post.createdAt.toISOString(),
        author: {
          id: post.author.id,
          name: post.author.name,
          displayName: post.author.profile?.displayName || post.author.name,
          avatar: post.author.profile?.avatar,
        },
      },
    }, 201);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// DELETE /api/forums/posts/:id - Delete post
forumRoutes.delete('/posts/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');

    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    if (post.authorId !== userId) {
      return c.json({ error: 'Not authorized to delete this post' }, 403);
    }

    await prisma.forumPost.delete({
      where: { id },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// POST /api/forums/posts/:id/like - Like/unlike post
forumRoutes.post('/posts/:id/like', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('id');

    // Check if already liked
    const existing = await prisma.forumPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      // Unlike
      await prisma.forumPostLike.delete({
        where: { id: existing.id },
      });
      await prisma.forumPost.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      return c.json({ liked: false });
    } else {
      // Like
      await prisma.forumPostLike.create({
        data: { postId, userId },
      });
      await prisma.forumPost.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      // Notify post author
      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true },
      });
      
      if (post && post.authorId !== userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
        
        const displayName = user?.profile?.displayName || user?.name || 'Someone';
        
        // TODO: Send notification when implemented
        // notifyUser(post.authorId, displayName + ' liked your post: ' + post.title.slice(0, 50));
      }

      return c.json({ liked: true });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    return c.json({ error: 'Failed to like post' }, 500);
  }
});

// ============================================================================
// COMMENTS
// ============================================================================

// POST /api/forums/posts/:id/comments - Add comment
forumRoutes.post('/posts/:id/comments', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('id');
    const body = await c.req.json();
    const { content, parentId } = body;

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Verify post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, title: true },
    });

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Create comment
    const comment = await prisma.forumComment.create({
      data: {
        postId,
        authorId: userId,
        content,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Notify post author (if not self-commenting)
    if (post.authorId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      
      const displayName = user?.profile?.displayName || user?.name || 'Someone';
      
      // TODO: Send notification when implemented
      // notifyUser(post.authorId, displayName + ' commented: ' + content.slice(0, 50));
    }

    // If replying to a comment, notify that author too
    if (parentId) {
      const parentComment = await prisma.forumComment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      
      if (parentComment && parentComment.authorId !== userId && parentComment.authorId !== post.authorId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
        
        const displayName = user?.profile?.displayName || user?.name || 'Someone';
        
        // TODO: Send notification when implemented  
        // notifyUser(parentComment.authorId, displayName + ' replied: ' + content.slice(0, 50));
      }
    }

    return c.json({
      comment: {
        id: comment.id,
        content: comment.content,
        parentId: comment.parentId,
        likesCount: 0,
        isLiked: false,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.author.id,
          name: comment.author.name,
          displayName: comment.author.profile?.displayName || comment.author.name,
          avatar: comment.author.profile?.avatar,
        },
      },
    }, 201);
  } catch (error) {
    console.error('Error creating comment:', error);
    return c.json({ error: 'Failed to create comment' }, 500);
  }
});

// POST /api/forums/comments/:id/like - Like/unlike comment
forumRoutes.post('/comments/:id/like', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const commentId = c.req.param('id');

    // Check if already liked
    const existing = await prisma.forumCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      // Unlike
      await prisma.forumCommentLike.delete({
        where: { id: existing.id },
      });
      await prisma.forumComment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      });
      return c.json({ liked: false });
    } else {
      // Like
      await prisma.forumCommentLike.create({
        data: { commentId, userId },
      });
      await prisma.forumComment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      });
      return c.json({ liked: true });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    return c.json({ error: 'Failed to like comment' }, 500);
  }
});

// DELETE /api/forums/comments/:id - Delete comment
forumRoutes.delete('/comments/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');

    const comment = await prisma.forumComment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    if (comment.authorId !== userId) {
      return c.json({ error: 'Not authorized to delete this comment' }, 403);
    }

    await prisma.forumComment.delete({
      where: { id },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// ============================================================================
// CATEGORIES
// ============================================================================

// GET /api/forums/categories - Get categories with post counts
forumRoutes.get('/categories', async (c) => {
  try {
    const categories = await prisma.forumPost.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const categoryList = [
    ];

    return c.json({
      categories: categoryList.map((cat) => ({
        ...cat,
        postCount: categories.find((c) => c.category === cat.id)?._count.id || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// ============================================================================
// HELPERS
// ============================================================================

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

