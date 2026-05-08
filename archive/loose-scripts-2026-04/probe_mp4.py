import struct, sys, os

path = r"C:\Users\alto8\Downloads\Test run-20250617_172233-Meeting Recording.mp4"
size = os.path.getsize(path)

def walk(f, end, depth=0, path_stack=()):
    while f.tell() < end:
        start = f.tell()
        hdr = f.read(8)
        if len(hdr) < 8:
            return
        box_size, box_type = struct.unpack(">I4s", hdr)
        try:
            btype = box_type.decode("ascii", errors="replace")
        except:
            btype = repr(box_type)
        header_len = 8
        if box_size == 1:
            box_size = struct.unpack(">Q", f.read(8))[0]
            header_len = 16
        elif box_size == 0:
            box_size = end - start
        payload_end = start + box_size
        print(f"{'  '*depth}{btype}  size={box_size}  @{start}")

        # Dig into container boxes
        containers = {"moov","trak","mdia","minf","stbl","udta","meta","edts","dinf","moof","traf","ilst","----"}
        if btype in containers:
            if btype == "meta":
                f.read(4)  # meta has 4-byte version/flags before children
            walk(f, payload_end, depth+1, path_stack+(btype,))
        elif btype == "hdlr":
            # hdlr payload: 4 version/flags, 4 pre_defined, 4 handler_type, 12 reserved, name(utf8)
            data = f.read(min(box_size-header_len, 256))
            if len(data) >= 24:
                handler = data[8:12].decode("ascii", errors="replace")
                name = data[24:].split(b"\x00",1)[0].decode("utf-8", errors="replace")
                print(f"{'  '*(depth+1)}>>> handler_type={handler!r}  name={name!r}")
            f.seek(payload_end)
        elif btype == "stsd":
            # sample description - tells you codec for each track
            data = f.read(min(box_size-header_len, 64))
            if len(data) >= 8:
                # skip 4 version/flags, 4 entry_count, then 4 size + 4 format
                if len(data) >= 16:
                    fmt = data[12:16].decode("ascii", errors="replace")
                    print(f"{'  '*(depth+1)}>>> sample_format={fmt!r}")
            f.seek(payload_end)
        elif btype in ("©nam","©cmt","©too","desc","©des","titl","©ART","©alb"):
            data = f.read(box_size-header_len)
            print(f"{'  '*(depth+1)}>>> metadata: {data[:200]!r}")
        else:
            f.seek(payload_end)

with open(path, "rb") as f:
    walk(f, size)
