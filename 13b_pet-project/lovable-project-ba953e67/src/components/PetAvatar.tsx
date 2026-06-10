import { getPet } from "@/lib/pets";

export function PetAvatar({
  petId,
  petName,
  size = 200,
  mood = "happy",
}: {
  petId?: string | null;
  petName?: string | null;
  size?: number;
  mood?: "happy" | "okay" | "sad";
}) {
  const pet = getPet(petId);
  const bob = mood === "sad" ? "" : "animate-[bob_3s_ease-in-out_infinite]";
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 50% 60%, color-mix(in oklab, ${pet.tint} 70%, transparent), transparent 70%)`,
        }}
      >
        <img
          src={pet.image}
          alt={petName ?? pet.name}
          className={`w-[88%] h-[88%] object-contain ${bob}`}
          style={{ filter: mood === "sad" ? "saturate(0.6)" : undefined }}
          width={size}
          height={size}
        />
      </div>
      {petName && (
        <div className="mt-3 font-semibold text-lg">{petName}</div>
      )}
      <style>{`@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
