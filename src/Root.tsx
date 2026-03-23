import { Composition } from "remotion";
import { ProductDemo } from "./ProductDemo";
import { GlobalMemoryEncoding } from "./GlobalMemoryEncoding";
import { TieredKVStore } from "./TieredKVStore";
import { SparseAttentionRouting } from "./SparseAttentionRouting";
import { ContextAssembly } from "./ContextAssembly";
import { DocumentRoPE } from "./DocumentRoPE";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="GlobalMemoryEncoding"
        component={GlobalMemoryEncoding}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TieredKVStore"
        component={TieredKVStore}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SparseAttentionRouting"
        component={SparseAttentionRouting}
        durationInFrames={810}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ContextAssembly"
        component={ContextAssembly}
        durationInFrames={660}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DocumentRoPE"
        component={DocumentRoPE}
        durationInFrames={660}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
