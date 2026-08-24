import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if database already has users
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 3) {
      return { message: "Database already seeded with " + existingUsers.length + " users." };
    }

    const now = Date.now();

    // 1. Seed Channels
    const channels = [
      {
        name: "Packaging Design",
        slug: "packaging",
        description: "Tactile materials, unboxing structures, die-cuts, and sustainable packaging craft.",
        icon: "Package",
        coverImage: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
        colorCode: "#A3E635",
        memberCount: 1420,
      },
      {
        name: "Illustration & Concept",
        slug: "illustration",
        description: "Linework, character studies, visual narrative, and iterative brush explorations.",
        icon: "PenTool",
        coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
        colorCode: "#386641",
        memberCount: 2310,
      },
      {
        name: "Typography & Editorial",
        slug: "typography",
        description: "Variable fonts, bespoke letterforms, grid systems, and print layout craft.",
        icon: "Type",
        coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        colorCode: "#C97B84",
        memberCount: 980,
      },
      {
        name: "Furniture & Industrial",
        slug: "industrial",
        description: "Joinery, ergonomic mockups, timber grain, and physical form studies.",
        icon: "Layers",
        coverImage: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop",
        colorCode: "#4D7C0F",
        memberCount: 860,
      },
      {
        name: "Motion & Spatial",
        slug: "motion",
        description: "Kinetic typography, easing curves, lighting breakdowns, and 3D simulations.",
        icon: "Film",
        coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
        colorCode: "#4C6FFF",
        memberCount: 1140,
      },
      {
        name: "Architecture & Space",
        slug: "architecture",
        description: "Atmospheric sketches, materiality, light wells, and volumetric prototypes.",
        icon: "Compass",
        coverImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
        colorCode: "#588157",
        memberCount: 790,
      },
    ];

    for (const ch of channels) {
      const existing = await ctx.db
        .query("channels")
        .withIndex("by_slug", (q) => q.eq("slug", ch.slug))
        .first();
      if (!existing) {
        await ctx.db.insert("channels", ch);
      }
    }

    // 2. Seed Creators
    const users = [
      {
        email: "aarohi@pickle.art",
        name: "Aarohi Sen",
        username: "aarohisen",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
        bio: "Designer & Illustrator exploring stories through form, texture, and tactile emotion.",
        disciplines: ["#illustration", "#packaging", "#typography"],
        growthPoints: 480,
      },
      {
        email: "dev@pickle.art",
        name: "Dev Patel",
        username: "devp",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
        bio: "Exploring unboxing ergonomics and sustainable kraft structures.",
        disciplines: ["#packaging", "#industrial"],
        growthPoints: 620,
      },
      {
        email: "meera@pickle.art",
        name: "Meera K.",
        username: "meerak",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop",
        bio: "Character studies, anatomical sketches & mythical creature world-building.",
        disciplines: ["#illustration", "#concept-art"],
        growthPoints: 540,
      },
      {
        email: "aarav@pickle.art",
        name: "Aarav S.",
        username: "aaravs",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
        bio: "Timber joinery, low-poly seating, and physical mockups.",
        disciplines: ["#industrial", "#furniture", "#architecture"],
        growthPoints: 710,
      },
      {
        email: "riya@pickle.art",
        name: "Riya M.",
        username: "riyam",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop",
        bio: "Brand identities built on historical nuance and modern grit.",
        disciplines: ["#typography", "#branding", "#packaging"],
        growthPoints: 390,
      },
      {
        email: "kabir@pickle.art",
        name: "Kabir L.",
        username: "kabirl",
        avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300&auto=format&fit=crop",
        bio: "Simulating light, gravity, and procedural motion physics.",
        disciplines: ["#motion", "#3d", "#spatial"],
        growthPoints: 590,
      },
    ];

    const userMap: Record<string, string> = {};
    for (const u of users) {
      let existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", u.email))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("users", {
          ...u,
          createdAt: now - 30 * 24 * 60 * 60 * 1000,
        });
        userMap[u.username] = id;
      } else {
        userMap[u.username] = existing._id;
      }
    }

    // 3. Seed Follow Relationships
    const followPairs = [
      ["aarohisen", "devp"],
      ["aarohisen", "meerak"],
      ["aarohisen", "aaravs"],
      ["devp", "aarohisen"],
      ["devp", "aaravs"],
      ["meerak", "aarohisen"],
      ["meerak", "kabirl"],
      ["aaravs", "devp"],
      ["kabirl", "aarohisen"],
      ["riyam", "devp"],
    ];

    for (const [f1, f2] of followPairs) {
      const id1 = userMap[f1];
      const id2 = userMap[f2];
      if (id1 && id2) {
        const existing = await ctx.db
          .query("follows")
          .withIndex("by_pair", (q) => q.eq("followerId", id1).eq("followingId", id2))
          .first();
        if (!existing) {
          await ctx.db.insert("follows", {
            followerId: id1,
            followingId: id2,
            createdAt: now - 10 * 24 * 60 * 60 * 1000,
          });
        }
      }
    }

    // 4. Seed 24-Hour Highlights
    const sampleHighlights = [
      {
        creatorUsername: "aarohisen",
        mediaUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
        mediaType: "image" as const,
        caption: "Testing earth pigments on raw watercolor cold-press today. The granulation is wild.",
        linkedProjectTitle: "Botanical Ink & Form Explorations",
      },
      {
        creatorUsername: "devp",
        mediaUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
        mediaType: "image" as const,
        caption: "Laser-cut interlocking tab experiment #4. No glue required, holds 4kg.",
        linkedProjectTitle: "Modular Kraft Packaging Concept",
      },
      {
        creatorUsername: "meerak",
        mediaUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop",
        mediaType: "image" as const,
        caption: "Quick 20-min silhouette thumbnail before diving into final render pass.",
        linkedProjectTitle: "Mythic Guardian Character Study",
      },
      {
        creatorUsername: "aaravs",
        mediaUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop",
        mediaType: "image" as const,
        caption: "First router pass on the ash armrest. Chamfer angle feels right in hand.",
        linkedProjectTitle: "Low-Profile Ash Lounger",
      },
      {
        creatorUsername: "kabirl",
        mediaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
        mediaType: "image" as const,
        caption: "Playing with fluid viscosity damping in Houdini. Audio sync test next.",
        linkedProjectTitle: "Kinetic Density Motion Study",
      },
    ];

    for (const hl of sampleHighlights) {
      const userId = userMap[hl.creatorUsername];
      const user = users.find((u) => u.username === hl.creatorUsername);
      if (userId && user) {
        await ctx.db.insert("highlights", {
          creatorId: userId,
          creatorName: user.name,
          creatorAvatar: user.avatarUrl,
          mediaUrl: hl.mediaUrl,
          mediaType: hl.mediaType,
          caption: hl.caption,
          linkedProjectTitle: hl.linkedProjectTitle,
          expiresAt: now + 20 * 60 * 60 * 1000,
          viewers: [],
          createdAt: now - 4 * 60 * 60 * 1000,
        });
      }
    }

    // 5. Seed Creative Projects with Stages & Crits
    const seedProjects = [
      {
        creatorUsername: "devp",
        title: "Modular Kraft Packaging Concept",
        description: "A glueless interlocking secondary packaging system crafted from 100% recycled unbleached kraft board.",
        goals: "Eliminate adhesive VOCs, withstand 1.5m drop tests, and create a rewarding tactile unboxing reveal.",
        discipline: "Packaging",
        tags: ["#packaging", "#kraft", "#sustainable", "#unboxing", "#papercraft"],
        tools: ["Illustrator", "Kongsberg Cutter", "Blender", "Physical Mockups"],
        coverUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1000&auto=format&fit=crop",
        status: "in_progress" as const,
        isExemptPhotography: false,
        stage1Completed: true,
        stage2Completed: true,
        outputUnlocked: true,
        stats: { views: 342, critsCount: 14, bookmarksCount: 56, timeSpentSeconds: 1420 },
      },
      {
        creatorUsername: "aaravs",
        title: "Low-Profile Ash Lounger",
        description: "Exploration of traditional Japanese wedged tenon joinery combined with modern CNC-milled contouring.",
        goals: "Zero metallic fasteners, flat-pack assembly under 4 minutes, ergonomic lumbar support without cushions.",
        discipline: "Industrial Design",
        tags: ["#furniture", "#industrial", "#woodworking", "#joinery", "#minimalism"],
        tools: ["Rhino", "Fusion 360", "Hand Planes", "Japanese Pull Saw"],
        coverUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=1000&auto=format&fit=crop",
        status: "in_progress" as const,
        isExemptPhotography: false,
        stage1Completed: true,
        stage2Completed: true,
        outputUnlocked: true,
        stats: { views: 480, critsCount: 19, bookmarksCount: 88, timeSpentSeconds: 2100 },
      },
      {
        creatorUsername: "meerak",
        title: "Mythic Guardian Character Study",
        description: "Iterative silhouette and anatomy studies for an ancient forest sentinel carrying woven pottery relics.",
        goals: "Balance imposing scale with benevolent silhouette readability in thumbnail size.",
        discipline: "Illustration",
        tags: ["#illustration", "#characterdesign", "#conceptart", "#creature", "#sketches"],
        tools: ["Procreate", "Photoshop", "Pencil on Paper"],
        coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop",
        status: "in_progress" as const,
        isExemptPhotography: false,
        stage1Completed: true,
        stage2Completed: true,
        outputUnlocked: true,
        stats: { views: 610, critsCount: 22, bookmarksCount: 112, timeSpentSeconds: 1850 },
      },
      {
        creatorUsername: "aarohisen",
        title: "Botanical Ink & Form Explorations",
        description: "Hand-foraged botanical pigments transformed into modular print identity assets.",
        goals: "Document natural color shifts across 6 weeks and develop a resilient digital vector counterpart.",
        discipline: "Typography",
        tags: ["#typography", "#botanical", "#print", "#editorial", "#branding"],
        tools: ["Screenprint", "Glyphs", "InDesign", "Spectrophotometer"],
        coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
        status: "complete" as const,
        isExemptPhotography: false,
        stage1Completed: true,
        stage2Completed: true,
        outputUnlocked: true,
        stats: { views: 820, critsCount: 31, bookmarksCount: 145, timeSpentSeconds: 3400 },
      },
      {
        creatorUsername: "kabirl",
        title: "Kinetic Density Motion Study",
        description: "Simulating gravitational micro-tides through particle physics and procedural easing.",
        goals: "Create seamless loopable motion that feels physical and non-algorithmic.",
        discipline: "Motion",
        tags: ["#motion", "#3d", "#simulation", "#procedural", "#particles"],
        tools: ["Houdini", "Cinema4D", "Octane Render", "After Effects"],
        coverUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop",
        status: "in_progress" as const,
        isExemptPhotography: false,
        stage1Completed: true,
        stage2Completed: false,
        outputUnlocked: false,
        stats: { views: 290, critsCount: 8, bookmarksCount: 42, timeSpentSeconds: 980 },
      },
    ];

    for (const p of seedProjects) {
      const creatorId = userMap[p.creatorUsername];
      const creator = users.find((u) => u.username === p.creatorUsername);
      if (!creatorId || !creator) continue;

      const projectId = await ctx.db.insert("projects", {
        creatorId,
        creatorName: creator.name,
        creatorUsername: creator.username,
        creatorAvatar: creator.avatarUrl,
        title: p.title,
        description: p.description,
        goals: p.goals,
        discipline: p.discipline,
        tags: p.tags,
        tools: p.tools,
        coverUrl: p.coverUrl,
        privacy: "public",
        status: p.status,
        isExemptPhotography: p.isExemptPhotography,
        stage1Completed: p.stage1Completed,
        stage2Completed: p.stage2Completed,
        outputUnlocked: p.outputUnlocked,
        outputPublished: p.status === "complete",
        stats: p.stats,
        createdAt: now - 14 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      });

      // 5.1 Stage 1 Spatial Items (Google Stitch Canvas)
      const canvasItems = [
        {
          type: "frame" as const,
          title: "Section 01 — Material Reference & Tone",
          x: 60,
          y: 60,
          width: 620,
          height: 480,
          zIndex: 1,
          content: "Frame: Material Studies",
        },
        {
          type: "text_sticky" as const,
          title: "Core Thesis",
          x: 90,
          y: 110,
          width: 220,
          height: 140,
          rotation: -2,
          zIndex: 3,
          color: "#FFE066",
          content: "The unboxing should feel silent and deliberate — no plastic tear strips, no loud tape crinkle.",
        },
        {
          type: "image" as const,
          title: "Grain Texture Reference",
          x: 340,
          y: 100,
          width: 300,
          height: 200,
          rotation: 1,
          zIndex: 2,
          content: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop",
          metadata: { caption: "350gsm unbleached virgin pulp sample" },
        },
        {
          type: "text_sticky" as const,
          title: "Constraint Note",
          x: 100,
          y: 280,
          width: 200,
          height: 130,
          rotation: 1.5,
          zIndex: 4,
          color: "#FFB4C6",
          content: "Must fold from a single flat dieline without adhesive tabs to allow 100% home composting.",
        },
        {
          type: "image" as const,
          title: "Joinery Mockup",
          x: 330,
          y: 320,
          width: 310,
          height: 190,
          rotation: -1,
          zIndex: 3,
          content: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
          metadata: { caption: "Scoring depth test: 60% vs 75% crease" },
        },
      ];

      for (const item of canvasItems) {
        await ctx.db.insert("stage1Items", {
          projectId,
          type: item.type,
          title: item.title,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          rotation: item.rotation || 0,
          zIndex: item.zIndex,
          color: item.color,
          content: item.content,
          metadata: item.metadata,
          createdAt: now - 12 * 24 * 60 * 60 * 1000,
          updatedAt: now - 12 * 24 * 60 * 60 * 1000,
        });
      }

      // 5.2 Stage 2 Sub-cards (Experiments & Polls)
      const subcardId1 = await ctx.db.insert("stage2Subcards", {
        projectId,
        title: "Experiment 01 — Dieline Tab Geometry",
        processNotes: "We tested three different latch mechanisms: a friction dovetail, a curved friction tongue, and a dual-locking wing. The curved tongue gives the most satisfying audible *pop* when opening while remaining structurally rigid when stacked under weight.",
        mediaUrls: [
          {
            url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
            type: "image",
            caption: "Cardboard laser cuts at 30W speed 40",
          },
        ],
        poll: {
          question: "Which latch mechanism should we standardize for production?",
          isOpen: true,
          options: [
            { id: "opt_1", text: "Curved Friction Tongue (Audible pop)", voters: [userMap["aarohisen"], userMap["aaravs"]] },
            { id: "opt_2", text: "Dovetail Wedge (Highest rigidity)", voters: [userMap["meerak"]] },
            { id: "opt_3", text: "Dual-locking Wing (Faster assembly)", voters: [] },
          ],
        },
        linkedStage1ItemIds: [],
        orderIndex: 0,
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
      });

      // 5.3 Stage-Pinned Crits
      await ctx.db.insert("crits", {
        projectId,
        authorId: userMap["aarohisen"],
        authorName: "Aarohi Sen",
        authorUsername: "aarohisen",
        authorAvatar: users[0].avatarUrl,
        targetStage: "stage2",
        targetSubcardId: subcardId1,
        whatWorked: "The grain direction orientation relative to the main score line prevents that ugly fiber cracking on the fold edge. Super clean.",
        whatToTryNext: "Consider embossing the finger-pull notch with a slight deboss bevel to make the opening gesture even more intuitive in low light.",
        content: "Love the commitment to zero-glue fabrication!",
        skillReactions: ["Material Texture", "Hierarchy", "Execution"],
        isPinned: true,
        createdAt: now - 6 * 24 * 60 * 60 * 1000,
      });

      // 5.4 If complete, insert final output
      if (p.status === "complete") {
        await ctx.db.insert("finalOutputs", {
          projectId,
          title: "Botanical Ink & Identity Suite — Final Release",
          summary: "A complete archival packaging and visual identity system created entirely from walnut husks, avocado pits, and wild indigo. Screen-printed onto 300gsm handmade cotton rag.",
          behindTheScenes: "Across 42 days of ink extraction and spectral scanning, we established a formulation that achieves 94% UV stability without chemical mordants.",
          mediaUrls: [
            {
              url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
              type: "image",
              caption: "Final screenprint proof and bottle packaging",
            },
          ],
          fileAttachments: [
            {
              name: "Botanical_Identity_Guidelines.pdf",
              url: "https://pickle-art-s3-storage.s3.ap-southeast-2.amazonaws.com/samples/guidelines.pdf",
              sizeBytes: 8420000,
              type: "application/pdf",
            },
          ],
          publishedAt: now - 2 * 24 * 60 * 60 * 1000,
        });
      }
    }

    return { success: true, message: "Database seeded successfully with rich creators, highlights, projects, moodboards, and crits!" };
  },
});
