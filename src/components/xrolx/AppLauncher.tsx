import { motion, AnimatePresence } from "motion/react";
import { X, LayoutGrid } from "lucide-react";
import { APPS } from "./apps";

export function AppLauncher({
  open,
  onClose,
  onOpen,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-deep/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative h-full w-full flex flex-col"
          >
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center gap-2 text-mint">
                <LayoutGrid className="w-5 h-5" />
                <span className="text-sm uppercase tracking-widest">
                  Xrolx Apps
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-mint/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-8 pb-12">
              <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {APPS.map((a, i) => (
                  <motion.button
                    key={a.id}
                    onClick={() => onOpen(a.id)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    whileHover={{ y: -3 }}
                    className="group glass rounded-2xl p-5 text-left hover:bg-mint/10 transition relative overflow-hidden"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 ring-1 ring-mint/20"
                      style={{
                        background: `radial-gradient(circle at 30% 20%, ${a.hue}33, transparent 70%), oklch(0.22 0.045 225)`,
                      }}
                    >
                      <a.icon className="w-6 h-6" style={{ color: a.hue }} />
                    </div>
                    <div className="text-sm font-medium text-foreground">{a.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.short}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-mint/60 mt-3">
                      {a.category}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
