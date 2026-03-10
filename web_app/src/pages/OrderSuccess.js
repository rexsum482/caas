export default function OrderSuccess() {

  return (

    <div className="flex flex-col items-center mt-20">

      <h1 className="text-3xl font-bold">
        Order Successful
      </h1>

      <p className="mt-4 text-gray-500">
        Thank you for your purchase.
      </p>

      <a
        href="/"
        className="mt-6 text-blue-500"
      >
        Return to store
      </a>

    </div>

  );

}