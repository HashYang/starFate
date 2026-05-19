// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "starFate",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "starFate",
            targets: ["starFate"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "starFate",
            path: "Sources/starFate"
        ),
        .testTarget(
            name: "starFateTests",
            dependencies: ["starFate"],
            path: "Tests/starFateTests"
        ),
    ]
)
